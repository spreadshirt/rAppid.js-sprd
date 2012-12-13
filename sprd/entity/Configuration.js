define(['js/data/Entity', 'sprd/entity/Offset', 'sprd/entity/Size'], function (Entity, Offset, Size) {
	return Entity.inherit('sprd.entity.Configuration', {

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

        height: function () {
            return this.size().$.height * this.$.scale.y;
        }.onChange("scale","size()"),

        width: function() {
            return this.size().$.width * this.$.scale.x;
        }.onChange("scale","size()")
	});
});
