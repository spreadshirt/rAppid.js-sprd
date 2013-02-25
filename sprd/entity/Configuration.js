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

            _printTypePrice: "{printType.price}"
        },

        ctor: function () {
            this.callBase();

            function triggerConfigurationChanged(e) {
                this.trigger('configurationChanged');
            }


            this.bind('change:offset', function (e) {
                if (e.$ && !e.$.isDeepEqual(this.$previousAttributes["offset"])) {
                    this.trigger('configurationChanged');
                }
            }, this);
            this.bind('change:scale', triggerConfigurationChanged, this);
            this.bind('change:rotation', triggerConfigurationChanged, this);
            this.bind('change:printArea', triggerConfigurationChanged, this);
            this.bind('change:printColors', triggerConfigurationChanged, this);
        },

        _commitChangedAttributes: function ($) {
            this._setError(this._validateTransform($));
            this.callBase();
        },

        _validateTransform: function ($) {

            var rotationChanged = this._hasSome($, ["rotation"]),
                sizeChanged = this._hasSome($, ["_size", "_x", "_y", "scale", "offset"]),
                printTypeChanged = this._hasSome($, ["printType"]),
                width, height,
                printType = $.printType || this.$.printType,
                scale = $.scale || this.$.scale,
                rotation = $.rotation || this.$.rotation,
                ret = {};

            if (sizeChanged || rotationChanged) {
                width = this.width(scale.x);
                height = this.height(scale.y);

                ret.hardBoundary = this._hasHardBoundaryError($.offset || this.$.offset, width, height, rotation, scale);
            }

            if (sizeChanged || printTypeChanged) {
                width = width || this.width();
                height = height || this.height();
                _.extend(ret, this._validatePrintTypeSize(printType, width, height, scale));
            }

            return ret;

        },

        _validatePrintTypeSize: function (printType, width, height, scale) {
            if (!printType) {
                return {};
            }

            return {
                printTypeScaling: !printType.isScalable() && (scale.x != 1 || scale.y != 1),
                printTypeEnlarged: printType.isShrinkable() && Math.min(scale.x, scale.y) > 1,
                maxBound: width > printType.get("size.width") || height > printType.get("size.height")
            };

        },

        _hasHardBoundaryError: function (offset, width, height, rotation, scale) {

            var printArea = this.$.printArea;

            if (!(printArea && offset)) {
                return;
            }

            var boundingBox = this._getBoundingBox(offset, width, height, rotation);

            return !(boundingBox.x >= 0 && boundingBox.y >= 0 &&
                (boundingBox.x + boundingBox.width) <= printArea.get("boundary.size.width") &&
                (boundingBox.y + boundingBox.height) <= printArea.get("boundary.size.height"));

        },

        _getBoundingBox: function (offset, width, height, rotation) {

            offset = offset || this.$.offset;
            width = width || this.width();
            height = height || this.height();
            rotation = rotation || this.$.rotation;

            var x = offset.$.x,
                y = offset.$.y;

            if (!rotation) {
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

            var halfW = width / 2,
                halfH = height / 2;

            var points = [
                [-halfW, -halfH],
                [halfW, -halfH],
                [halfW, halfH],
                [-halfW, halfH]
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
                x: minX + halfW + x,
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
        }.onChange("scale", "size()"),

        width: function (scale) {

            if (!scale && scale !== 0) {
                scale = this.$.scale.x;
            }

            return Math.abs(this.size().$.width * scale);
        }.onChange("scale", "size()"),

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
            if(printTypePrice){
                return printTypePrice.clone();
            }
            return new Price();
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
        }
    });
});
