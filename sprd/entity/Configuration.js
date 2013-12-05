define(['js/data/Entity', 'sprd/entity/Offset', 'sprd/entity/Size', 'sprd/entity/PrintArea', 'sprd/model/PrintType', 'js/core/List' , "sprd/entity/Price", "sprd/type/Matrix2d", "sprd/util/ProductUtil", "sprd/entity/PrintTypeColor", "underscore"], function (Entity, Offset, Size, PrintArea, PrintType, List, Price, Matrix2d, ProductUtil, PrintTypeColor, _) {

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

            // bind this
            _size: "{size()}",
            _x: "{offset.x}",
            _y: "{offset.y}",

            _isDeletable: true,

            _printTypePrice: "{printType.price}"
        },

        _commitChangedAttributes: function ($, options) {

            var delay = options && options.userInteraction ? 300 : 0,
                self = this,
                combinedAttributes = {};

            this.callBase();

            if (this._hasSome($, ["scale", "rotation", "printArea", "printColors", "printArea", "printType"])) {
                validate($);
                this.trigger('configurationChanged');
            } else if ($.hasOwnProperty("offset")) {
                if ($.offset && !$.offset.isDeepEqual(this.$previousAttributes["offset"])) {
                    validate($);
                    this.trigger('configurationChanged');
                }
            }

            function validate(attributes) {
                _.extend(combinedAttributes, attributes);
                self._debounceFunctionCall(performValidate, "validateTransform", delay, self);
            }

            function performValidate() {
                self._setError(self._validateTransform(combinedAttributes));
                combinedAttributes = {};
            }

        },

        _validateTransform: function ($) {

            var rotationChanged = this._hasSome($, ["rotation"]),
                sizeChanged = this._hasSome($, ["_size", "_x", "_y", "scale", "offset", "bound"]),
                printTypeChanged = this._hasSome($, ["printType"]),
                width, height,
                printType = $.printType || this.$.printType,
                scale = $.scale || this.$.scale,
                rotation = $.rotation || this.$.rotation,
                ret = {},
                printArea = this.$.printArea;

            if (sizeChanged || rotationChanged) {
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

            if (sizeChanged || printTypeChanged) {
                width = width || this.width();
                height = height || this.height();
                _.extend(ret, this._validatePrintTypeSize(printType, width, height, scale));
            }

            if (ret.minBound && this.$context && this.$context.$contextModel && !printTypeChanged) {
                var printTypes = this.getPossiblePrintTypesForPrintArea(this.$.printArea, this.$context.$contextModel.get('appearance.id'));
                for (var i = 0; i < printTypes.length; i++) {
                    if (!printTypes[i].isPrintColorColorSpace()) {
                        this.set('printType', printTypes[i]);
                        ret.minBound = false;
                        break;
                    }

                }
            }

            return ret;

        },

        _validatePrintTypeSize: function (printType, width, height, scale) {
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

        isPrintTypeAvailable: function (printType) {

            var ret = this._validatePrintTypeSize(printType, this.get('size.width'), this.get('size.height'), this.$.scale);

            return !ret.maxBound && !ret.minBound && !ret.printTypeScaling;
        }.onChange('_size.width', '_size.height', 'scale'),

        _hasHardBoundaryError: function (offset, width, height, rotation, scale) {

            var printArea = this.$.printArea;

            if (!(printArea && offset)) {
                return null;
            }

            var boundingBox = this._getBoundingBox(offset, width, height, rotation, scale, true);

            return !(boundingBox.x >= -0.1 && boundingBox.y >= -0.1 &&
                (boundingBox.x + boundingBox.width - 0.1) <= printArea.get("boundary.size.width") &&
                (boundingBox.y + boundingBox.height - 0.1) <= printArea.get("boundary.size.height"));

        },

        _getBoundingBox: function (offset, width, height, rotation, scale, onlyContent, xOffset) {

            offset = offset || this.$.offset;
            width = width || this.width();
            height = height || this.height();
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

        size: function () {
            this.log("size() not implemented", "debug");
            return Size.empty;
        },

        height: function (scale) {

            if (!scale && scale !== 0) {
                scale = this.$.scale.y;
            }

            return Math.abs(this.size().$.height * scale);
        }.onChange("scale", "size()").on("sizeChanged"),

        width: function (scale) {

            if (!scale && scale !== 0) {
                scale = this.$.scale.x;
            }

            return Math.abs(this.size().$.width * scale);
        }.onChange("scale", "size()").on("sizeChanged"),

        isScalable: function () {
            return this.get("printType.isScalable()");
        }.onChange("printType"),

        isRotatable: function () {
            return true;
        },

        isRemovable: function () {
            return true;
        },

        price: function () {
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
        getSizeForPrintType: function (printType) {
            return Size.empty;
        },

        possiblePrintTypes: function (appearance) {
            var ret = [],
                printArea = this.$.printArea;

            if (printArea && appearance) {
                ret = ProductUtil.getPossiblePrintTypesForPrintAreas([printArea], appearance.$.id);
            }

            return ret;
        }.onChange("printArea"),

        isAllowedOnPrintArea: function (printArea) {
            return false;
        },

        getPossiblePrintTypesForPrintArea: function () {
            return [];
        },

        allowScale: function () {
            return true;
        },

        minimumScale: function () {
            return 0;
        },

        isReadyForCompose: function () {
            return true;
        }
    });
});
