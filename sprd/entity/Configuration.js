define(['js/data/Entity', 'sprd/entity/offset'], function (Entity, Offset) {
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
        }
	});
});
