define(["js/data/Entity", "sprd/entity/ShippingCost"], function (Entity, ShippingCost) {
    return Entity.inherit("sprd.entity.ShippingRegion", {

        schema: {
            shippingCosts: [ShippingCost]
        },

        getShippingCostsForOrderValue: function(value) {

            var shippingCosts = this.$.shippingCosts;
            if (shippingCosts) {
                for (var i = 0; i < shippingCosts.$items.length; i++) {
                    var shippingCost = shippingCosts.$items[i],
                        orderValueRange = shippingCost.$.orderValueRange;


                    if (value >= orderValueRange.$.from && (orderValueRange.$.to === null || value <= orderValueRange.$.to)) {
                        // found the cost
                        return shippingCost;
                    }
                }
            }

            return null
        },

    });
});
