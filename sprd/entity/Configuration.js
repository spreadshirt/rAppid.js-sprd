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

        _commitPrintType: function (printType) {

            if (!printType) {
                return;
            }

            var printTypeColors = this.$.printColors;

            if (printTypeColors) {
                // convert all colors to new print type

                for (var i = 0; i < printTypeColors.$items.length; i++) {
                    var printTypeColor = printTypeColors.$items[i];

                    if (!printType.containsPrintTypeColor(printTypeColor)) {

                    }
                }

            }

        },

        _commitChangedAttributes: function($) {
            if (this._hasSome($, ["_size", "_x", "_y", "scale"])) {
                this._setError("hardBoundary", this._hasHardBoundaryError(this.$.offset, this.width(), this.height()));
            }
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
