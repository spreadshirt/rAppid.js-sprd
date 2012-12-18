define(['js/data/Entity', 'sprd/entity/Offset', 'sprd/entity/Size', 'sprd/entity/PrintArea','sprd/model/PrintType'], function (Entity, Offset, Size, PrintArea, PrintType) {

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

        ctor: function() {
            this.callBase();
        },

		defaults : {
            printArea: null,
            printType: null,
            offset: Offset,
            scale: {
                x: 1,
                y: 1
            },
            rotation: 0
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
        }.onChange("scale","size()")
	});
});
