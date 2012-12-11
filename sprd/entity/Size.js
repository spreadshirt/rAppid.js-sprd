define(['js/data/Entity', 'sprd/entity/Price', 'sprd/model/PrintType', 'sprd/entity/Color'], function(Entity, Price, PrintType, Color) {
    return Entity.inherit('sprd.entity.Offset', {
        defaults: {
            width: 0,
            height: 0,

            tags: ""
        },

        schema: {
            width: Number,
            height: Number,

            tags: String,

            colors: [Color],
            printTypes: [PrintType],

            price: Price
        }
    })
});