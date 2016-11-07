define(['js/data/Entity'], function(Entity) {
    return Entity.inherit('sprd.entity.ProductTypeAttribute', {
        schema: {
            key: String,
            name: String,
            description: String
        }
    })
});