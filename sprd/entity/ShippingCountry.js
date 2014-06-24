define(["js/data/Entity", "sprd/entity/ShippingRegion", "sprd/entity/ShippingState"], function (Entity, ShippingRegion, ShippingState) {
    return Entity.inherit("sprd.entity.ShippingCountry", {

        defaults: {
            name: null,
            isoCode: null,
            shippingRegion: null,
            externalFulfillmentSupported: true,
            trackingLink: null
        },

        schema: {
            name: String,
            shippingRegion: {
                isReference: true,
                type: ShippingRegion
            },
            externalFulfillmentSupported: Boolean,
            trackingLink: Object,
            shippingStates: [ShippingState]
        },

        idField: "code",

        parse: function (data) {
            var ret = this.callBase();
            ret.code = data.isoCode;

            return ret;
        }

    });
});
