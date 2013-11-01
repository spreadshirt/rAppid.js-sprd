define(["js/data/Entity", "sprd/model/Currency"], function (Entity, Currency) {

    var OrderValueRange = Entity.inherit("sprd.entity.ShippingCost.OrderValueRange", {

        schema: {
            from: Number,
            to: Number,
            currency: Currency
        }

    });

    var Cost = Entity.inherit("sprd.entity.ShippingCost.Cost", {

        schema: {
            vatExcluded: Number,
            vatIncluded: Number,
            vat: Number,
            currency: Currency
        }

    });

    return Entity.inherit("sprd.entity.ShippingCost", {

        schema: {
            orderValueRange: OrderValueRange,
            cost: Cost
        }

    });
});
