define(['js/data/Entity'], function(Entity) {
    return Entity.inherit('sprd.entity.Color', {
        defaults: {
            layer: null,
            "default": null,
            origin: null
        },

        schema: {
            layer: Number,
            "default": String,
            origin: String
        }
    })
});