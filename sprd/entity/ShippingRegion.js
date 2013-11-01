define(["js/data/Entity", "sprd/entity/ShippingCost"], function (Entity, ShippingCost) {
    return Entity.inherit("sprd.entity.ShippingRegion", {

        schema: {
            shippingCosts: [ShippingCost]
        }

    });
});
