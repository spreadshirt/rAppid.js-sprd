define(['js/data/Entity'], function(Entity) {
    return Entity.inherit('sprd.entity.AppearanceColor', {
        schema: {
            index: Number,
            value: String
        }
    })
});