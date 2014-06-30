define(["sprd/entity/Country", "sprd/entity/ShippingRegion", "sprd/entity/ShippingState"], function (Country, ShippingRegion, ShippingState) {
    return Country.inherit("sprd.entity.ShippingCountry", {

        defaults: {
            name: null,
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

        parse: function (data) {
            var ret = this.callBase();
            // shipping countries use isoCode -> checkout address use code
            // that's why we did this shit here
            if (data.isoCode) {
                ret.code = data.isoCode;
            }

            return ret;
        }

    });
});
