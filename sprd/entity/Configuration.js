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
            printColors: List
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


        size: function() {
            this.log("size() not implemented", "debug");
            return null;
        },

        height: function (scale) {

            if (!scale && scale !== 0) {
                scale = this.$.scale.y;
            }

            return this.size().$.height * scale;
        }.onChange("scale","size()"),

        width: function(scale) {

            if (!scale && scale !== 0) {
                scale = this.$.scale.x;
            }

            return this.size().$.width * scale;
        }.onChange("scale","size()"),

        isScalable: function() {
            return this.get("printType.isScalable()");
        }.onChange("printType")
	});
});
