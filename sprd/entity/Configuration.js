define(['js/data/Entity', 'sprd/entity/Offset', 'sprd/entity/Size', 'sprd/entity/PrintArea', 'sprd/model/PrintType', 'js/core/List', "sprd/entity/Price", "sprd/type/Matrix2d", "sprd/util/ProductUtil", "sprd/entity/PrintTypeColor", "underscore", "js/core/Bus"], function(Entity, Offset, Size, PrintArea, PrintType, List, Price, Matrix2d, ProductUtil, PrintTypeColor, _, Bus) {

    return Entity.inherit('sprd.entity.Configuration', {

        schema: {
            offset: Offset,
            printArea: {
                type: PrintArea,
                isReference: true
            },
            printType: PrintType,
            printColors: [PrintTypeColor],

            content: Object,
            restrictions: Object,
            properties: Object,
            type: String
        },

        defaults: {
            printArea: null,
            printType: null,
            offset: Offset,
            scale: {
                x: 1,
                y: 1
            },
            rotation: 0,
            printColors: List,

            textEditable: true,

            // bind this
            _size: "{size()}",
            _x: "{offset.x}",
            _y: "{offset.y}",

            _isDeletable: true,
            docked: false,
            _printTypePrice: "{printType.price}",
            properties: Object
        },

        inject: {
            bus: Bus
        },

        save: function(callback) {
            callback && callback();
        },

        saveTakesTime: function() {
            return false;
        },

        _commitChangedAttributes: function($, options) {

            var delay = options && options.userInteraction ? 300 : 0,
                self = this,
                combinedAttributes = {};

            this.callBase();

            if (this._hasSome($, ["scale", "rotation", "printArea", "printColors", "printArea", "printType"])) {
                if ($.printType && !options.printTypeTransformed) {
                    // manually changed print type
                    this.$.printTypeWasScaled = false;
                }
                if ($.printType && !options.printTypeEqualized) {
                    this.trigger('printTypeSwitched', {
                        printType: $.printType,
                        scaledDown: !!options.scaledDown
                    }, this);
                }
                if (!options.preventValidation && !options.initial) {
                    validate($);
                }
                this.trigger('configurationChanged');
            } else if ($.hasOwnProperty("offset") && $.offset && !$.offset.isDeepEqual(this.$previousAttributes["offset"])) {
                if (!options.preventValidation && !options.initial) {
                    validate($);
                }
                this.trigger('configurationChanged');
            }

            validate(this._additionalValidation($, options));

            function validate (attributes) {

                if (!attributes) {
                    return;
                }

                _.extend(combinedAttributes, attributes);
                self._debounceFunctionCall(performValidate, "validateTransform", delay, self);
            }

            function performValidate () {
                self._setError(self._validateTransform(combinedAttributes));
                combinedAttributes = {};
            }

        },

        _additionalValidation: function($, options) {
            return null;
        },

        _validateTransform: function($) {

            var rotationChanged = this._hasSome($, ["rotation"]),
                sizeChanged = this._hasSome($, ["_size", "_x", "_y", "scale", "offset", "bound"]),
                printTypeChanged = this._hasSome($, ["printType"]),
                width, height,
                printType = $.printType || this.$.printType,
                scale = $.scale || this.$.scale,
                rotation = $.rotation || this.$.rotation,
                ret = {},
                printArea = this.$.printArea;

            if (sizeChanged || rotationChanged || $.validateHardBoundary) {
                width = this.width(scale.x);
                height = this.height(scale.y);

                if (printArea) {

                    if (printArea.hasSoftBoundary()) {
                        ret.hardBoundary = false;
                    } else {
                        ret.hardBoundary = this._hasHardBoundaryError($.offset || this.$.offset, width, height, rotation, scale);
                    }
                }

            }

            if (sizeChanged || printTypeChanged || $.validatePrintTypeSize) {
                width = width || this.width();
                height = height || this.height();
                _.extend(ret, this._validatePrintTypeSize(printType, width, height, scale));
            }


            var printTypeTooSmall = ret.minBound,
                printTypeWasScaled = false;

            // try to scale back when one configuration of the print area was scaled
            if (this.$context && this.$context.$contextModel) {
                var printAreaConfigurations = this.$context.$contextModel.getConfigurationsOnPrintAreas([printArea]);
                for (var k = 0; k < printAreaConfigurations.length; k++) {
                    var c = printAreaConfigurations[k];
                    if (c.$.printTypeWasScaled) {
                        printTypeWasScaled = true;
                        break;
                    }
                }
            }


            // when configuration is too small for print type or it is a DD print type try to find another print type that fits better
            if (printType && (printTypeTooSmall || printTypeWasScaled) && this.$context && this.$context.$contextModel && !printTypeChanged && sizeChanged) {
                var product = this.$context.$contextModel,
                    appearance = this.$context.$contextModel.get('appearance'),
                    originalPrintType = this.$.originalPrintType;
                if (product.$.configurations.size() > 0 && !printTypeTooSmall && originalPrintType) {
                    var revertPossible = true;
                    var configurations = product.$.configurations.toArray();
                    for (var j = 0; j < configurations.length; j++) {
                        var config = configurations[j];

                        var possiblePrintTypes = config.getPossiblePrintTypesForPrintArea(printArea, appearance);

                        if (config !== this && config.$.printArea === printArea && (possiblePrintTypes.indexOf(originalPrintType) === -1 || !config.isPrintTypeAvailable(originalPrintType))) {
                            revertPossible = false;
                        }

                    }
                    // don't transform
                    if (!revertPossible) {
                        return ret;
                    }
                }

                var printTypes = this.getPossiblePrintTypesForPrintArea(this.$.printArea, appearance);
                var preferredPrintType = null,
                    val,
                    newPrintType;

                for (var i = 0; i < printTypes.length; i++) {
                    newPrintType = printTypes[i];
                    val = this._validatePrintTypeSize(newPrintType, width, height, scale);
                    if (!(val.printTypeScaling || val.maxBound || val.minBound || val.dpiBound)) {
                        // if the previous print type is valid, use it
                        if (printTypeWasScaled && this.$.originalPrintType === newPrintType) {
                            preferredPrintType = newPrintType;
                            this.$.originalPrintType = null;
                            this.$.printTypeWasScaled = false;
                            break;
                        } else if (printTypeTooSmall) {
                            preferredPrintType = newPrintType;
                            this.$.originalPrintType = printType;
                            this.$.printTypeWasScaled = true;
                            break;
                        }
                    }
                }

                if (preferredPrintType && preferredPrintType !== printType) {
                    this.$.bus && this.$.bus.trigger("Configuration.automaticallyPrintTypeChange", {
                        printType: preferredPrintType,
                        scale: scale
                    });
                    this.set('printType', preferredPrintType, {
                        preventValidation: true,
                        printTypeTransformed: true
                    });
                    ret.minBound = false;
                }
            }

            return ret;

        },

        _validatePrintTypeSize: function(printType, width, height, scale) {
            if (!printType) {
                return {};
            }

            var printArea = this.$.printArea;
            if (printArea && printArea.hasSoftBoundary()) {
                // if we use softboundaries the size of the configuration is maximum the
                // size of the softboudary. As long as we haven't the size of the softboundary
                // we use the size of the print area
                width = Math.min(width, printArea.width());
                height = Math.min(height, printArea.height());
            }


            return {
                printTypeScaling: !printType.isScalable() && (scale.x != 1 || scale.y != 1),
                maxBound: width > printType.get("size.width") || height > printType.get("size.height"),
                minBound: false
            };

        },

        isPrintTypeAvailable: function(printType) {

            var ret = this._validatePrintTypeSize(printType, this.get('size.width'), this.get('size.height'), this.$.scale);

            return !ret.maxBound && !ret.minBound && !ret.printTypeScaling && !ret.dpiBound;
        }.onChange('_size.width', '_size.height', 'scale'),

        _hasHardBoundaryError: function(offset, width, height, rotation, scale) {

            var printArea = this.$.printArea;

            if (!(printArea && offset)) {
                return null;
            }

            var boundingBox = this._getBoundingBox(offset, width, height, rotation, scale, true);

            return !(boundingBox.x >= -0.1 && boundingBox.y >= -0.1 &&
            (boundingBox.x + boundingBox.width - 0.1) <= printArea.get("boundary.size.width") &&
            (boundingBox.y + boundingBox.height - 0.1) <= printArea.get("boundary.size.height"));

        },

        _getBoundingBox: function(offset, width, height, rotation, scale, onlyContent, xOffset) {

            offset = offset || this.$.offset;
            width = width || this.width(scale);
            height = height || this.height(scale);
            rotation = rotation || this.$.rotation;

            var x = offset.$.x,
                y = offset.$.y;

            if (!(rotation % 360)) {
                return {
                    x: x,
                    y: y,
                    height: height,
                    width: width
                };
            }

            var minX,
                maxX,
                minY,
                maxY,
                matrix = new Matrix2d().rotateDeg(rotation);

            xOffset = xOffset || 0;

            var halfW = width / 2,
                halfH = height / 2;

            var points = [
                [-halfW + xOffset, -halfH],
                [halfW + xOffset, -halfH],
                [halfW + xOffset, halfH],
                [-halfW + xOffset, halfH]
            ];

            var point = matrix.transformPoint(points[0]);
            minX = maxX = point[0];
            minY = maxY = point[1];

            for (var i = 1; i < points.length; i++) {
                point = matrix.transformPoint(points[i]);

                minX = Math.min(point[0], minX);
                maxX = Math.max(point[0], maxX);
                minY = Math.min(point[1], minY);
                maxY = Math.max(point[1], maxY);
            }

            return {
                x: minX + halfW + x - xOffset,
                y: minY + halfH + y,
                width: maxX - minX,
                height: maxY - minY
            };

        },

        size: function() {
            this.log("size() not implemented", "debug");
            return Size.empty;
        },

        height: function(scale) {

            if (!scale && scale !== 0) {
                scale = this.get('scale.y') || 0;
            }

            return Math.abs(this.size().$.height * scale);
        }.onChange("scale", "size()").on("sizeChanged"),

        width: function(scale) {

            if (!scale && scale !== 0) {
                scale = this.get('scale.x') || 0;
            }

            return Math.abs(this.size().$.width * scale);
        }.onChange("scale", "size()").on("sizeChanged"),

        center: function() {
            return {
                x: this.get('offset.x') + this.width() / 2,
                y: this.get('offset.y') + this.height() / 2
            }
        }.onChange("offset", "offset.x", "offset.y", "width()", "height()"),

        isScalable: function() {
            return this.get("printType.isScalable()");
        }.onChange("printType"),

        isRotatable: function() {
            return true;
        },

        isRemovable: function() {
            return true;
        },

        price: function() {
            var printTypePrice = this.get('printType.price');
            if (printTypePrice) {
                return printTypePrice.clone();
            }
            return new Price();
        },

        /***
         *
         * @param {sprd.model.PrintType} printType
         * @return {sprd.entity.Size}
         */
        getSizeForPrintType: function(printType) {
            return Size.empty;
        },

        getPossiblePrintTypes: function(appearance) {
            var printArea = this.$.printArea;
            return this.getPossiblePrintTypesForPrintArea(printArea, appearance);
        }.onChange("printArea"),

        isAllowedOnPrintArea: function(printArea) {
            return false;
        },

        getPossiblePrintTypesForPrintArea: function() {
            return [];
        },

        getPreferredPrintArea: function(printAreas, appearance) {
            var self = this;

            return _.find(printAreas, function(printArea) {
                var possiblePrintTypes = self.getPossiblePrintTypesForPrintArea(printArea, appearance);
                return printArea && self.isAllowedOnPrintArea(printArea) && possiblePrintTypes.length;
            });
        },

        allowScale: function() {
            return true;
        },

        minimumScale: function() {
            return 0;
        },

        isReadyForCompose: function() {
            return true;
        }
    });
});
