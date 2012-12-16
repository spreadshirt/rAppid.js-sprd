define(['js/data/Entity', 'sprd/entity/Price'], function(Entity, Price) {
    return Entity.inherit('sprd.entity.PrintTypeColor', {
        schema: {
            name: String,
            fill: String,
            price: Price
        }
    })
});