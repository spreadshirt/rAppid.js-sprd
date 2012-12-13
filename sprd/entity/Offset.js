define(['js/data/Entity'], function(Entity) {
    return Entity.inherit('sprd.entity.Offset', {
        defaults: {
            x: 0,
            y: 0,
            unit: "mm"
        },

        schema: {
            x: Number,
            y: Number,
            unit: String
        }
    })
});