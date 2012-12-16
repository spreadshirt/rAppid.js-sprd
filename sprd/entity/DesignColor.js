define(['js/data/Entity'], function(Entity) {
    return Entity.inherit('sprd.entity.DesignColor', {
        schema: {
            "default": String,
            origin: String,
            layer: String
        }
    })
});