define(['sprd/data/SprdModel', 'sprd/entity/ShippingCountry', 'sprd/entity/ShippingRegion'], function (SprdModel, ShippingCountry, ShippingRegion) {

    return SprdModel.inherit('sprd.model.ShippingType', {
        defaults: {
            weight: null,
            name: '',
            description: '',
            trackingLink: null
        },

        schema: {
            weight: Number,
            name: String,
            description: String,
            trackingLink: Object,

            shippingCountries: [ShippingCountry],
            shippingRegions: [ShippingRegion]
        },

        /***
         * this method is necessary, because ShippingCountry should be a model, but is defined by the API as entity
         *
         * @param code
         * @returns {*}
         */
        getShippingCountryByCode: function (code) {

            for (var i = 0; i < this.$.shippingCountries.$items.length; i++) {
                var shippingCountry = this.$.shippingCountries.$items[i];
                if (shippingCountry.$.code == code) {
                    return shippingCountry;
                }
            }

            return null;
        },

        supportsShippingTo: function (shippingCountry) {
            return !!this.getShippingCountryByCode(shippingCountry.$.code);
        }

    });


});