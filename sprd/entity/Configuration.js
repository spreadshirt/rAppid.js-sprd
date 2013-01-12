define(['js/data/Entity', 'sprd/entity/Offset', 'sprd/entity/Size', 'sprd/entity/PrintArea','sprd/model/PrintType', 'js/core/List'], function (Entity, Offset, Size, PrintArea, PrintType, List) {

    var undefined;

    return Entity.inherit('sprd.entity.Configuration', {

        schema: {
            offset: Offset,
            printArea: {
                type: PrintArea,
                isReference: true
            },
            printType: PrintType
        },

		defaults : {
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
            _y: "{offset.y}"
        },

        _commitChangedAttributes: function($) {
            this._validateTransform($);
        },

        _validateTransform: function($) {

            var rotationChanged = this._hasSome($, ["rotation"]),
                sizeChanged = this._hasSome($, ["_size", "_x", "_y", "scale", "offset"]),
                printTypeChanged = this._hasSome($, ["printType"]),
                width, height,
                scale = $.scale || this.$.scale;

            if (sizeChanged || rotationChanged) {
                width = this.width(scale.x);
                height = this.height(scale.y);
                this._setError("hardBoundary", this._hasHardBoundaryError($.offset || this.$.offset, width, height));
            }

            if (sizeChanged || printTypeChanged) {
                width = width || this.width();
                height = height || this.height();

                this._validatePrintTypeSize(this.$.printType, width, height);
            }

        },

        _validatePrintTypeSize: function(printType, width, height) {
            if (!printType) {
                return;
            }

            this._setError("maxBounds", width > printType.get("size.width") || height > printType.get("size.height"))
        },

        _hasHardBoundaryError: function(offset, width, height) {

            var printArea = this.$.printArea;

            if (!(printArea && offset)) {
                return;
            }

            var x = offset.$.x,
                y = offset.$.y;

            return !(x >= 0 && y >= 0 &&
                (x + width) <= printArea.get("boundary.size.width") &&
                (y + height) <= printArea.get("boundary.size.height"));
        },

        size: function() {
            this.log("size() not implemented", "debug");
            return null;
        },

        height: function (scale) {

            if (!scale && scale !== 0) {
                scale = this.$.scale.y;
            }

            return Math.abs(this.size().$.height * scale);
        }.onChange("scale","size()"),

        width: function(scale) {

            if (!scale && scale !== 0) {
                scale = this.$.scale.x;
            }

            return Math.abs(this.size().$.width * scale);
        }.onChange("scale","size()"),

        isScalable: function() {
            return this.get("printType.isScalable()");
        }.onChange("printType"),

        isRotatable: function() {
            return true;
        },

        isRemovable: function() {
            return true;
        }
	});
});
