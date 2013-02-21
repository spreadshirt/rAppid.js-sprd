define(['js/data/Entity'], function(Entity) {

    var normalSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

    return Entity.inherit('sprd.entity.Size', {
        schema: {
            measures: [Entity]
        },
        isNormalSize: function () {
            for (var i = 0; i < normalSizes.length; i++) {
                if (normalSizes[i].toLowerCase() === this.$.name.toLowerCase()) {
                    return true;
                }
            }
            return false;
        }
    })
});