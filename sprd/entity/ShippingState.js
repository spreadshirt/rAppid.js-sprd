define(["js/data/Entity", "sprd/entity/ShippingRegion"], function (Entity, ShippingRegion) {

    return Entity.inherit("sprd.entity.ShippingState", {

        defaults: {
            name: "",
            isoCode: "",
            shippingRegion: null,
            shippingSupported: true,
            externalFulfillmentSupported: true
        },

        idField: "isoCode",

        schema: {
            name: String,
            isoCode: String,
            shippingRegion: ShippingRegion,
            shippingSupported: Boolean,
            externalFulfillmentSupported: Boolean
        }

    });
});
