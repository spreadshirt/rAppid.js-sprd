define(['js/data/Entity', 'sprd/type/Color'], function (Entity, Color) {
    return Entity.inherit('sprd.entity.DesignColor', {
        schema: {
            "default": String,
            origin: String,
            layer: String
        },

        parse: function (data) {
            data = this.callBase();
            data["default"] = Color.parse(data["default"]);
            data.origin = Color.parse(data.origin);
            return data;
        }
    })
});