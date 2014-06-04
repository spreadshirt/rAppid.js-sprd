define(["js/data/Entity", "sprd/entity/Price", "sprd/model/Currency"], function (Entity, Price, Currency) {

    var OrderValueRange = Entity.inherit("sprd.entity.ShippingCost.OrderValueRange", {

        defaults: {
            from: null,
            to: null,
            currency: null
        },

        schema: {
            from: Number,
            to: Number,
            currency: Currency
        }

    });

    return Entity.inherit("sprd.entity.ShippingCost", {

        schema: {
            orderValueRange: OrderValueRange,
            cost: Price
        }

    });
});
