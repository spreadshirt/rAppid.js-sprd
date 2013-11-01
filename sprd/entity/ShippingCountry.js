define(["js/data/Entity", "sprd/entity/ShippingRegion", "sprd/entity/ShippingState"], function (Entity, ShippingRegion, ShippingState) {
    return Entity.inherit("sprd.entity.ShippingCountry", {

        schema: {
            name: String,
            isoCode: String,
            shippingRegion: ShippingRegion,
            externalFulfillmentSupported: Boolean,
            shippingStates: [ShippingState]
        }

    });
});
