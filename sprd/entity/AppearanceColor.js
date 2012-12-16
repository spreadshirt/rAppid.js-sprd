define(['js/data/Entity', 'sprd/type/Color'], function(Entity, Color) {
    return Entity.inherit('sprd.entity.AppearanceColor', {
        schema: {
            index: Number,
            value: String
        },

        parse: function(data) {
            data = this.callBase();
            data.value = Color.parse(data.value);
            return data;
        }
    })
});