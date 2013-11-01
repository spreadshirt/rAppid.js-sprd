define(['sprd/data/SprdModel', 'sprd/entity/ShippingCountry'], function (SprdModel, ShippingCountry) {

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

            shippingCountries: [ShippingCountry]
        },

        getShippingCountryById: function (id) {

            for (var i = 0; i < this.$.shippingCountries.$items.length; i++) {
                var shippingCountry = this.$.shippingCountries.$items[i];
                if (shippingCountry.$.id == id) {
                    return shippingCountry;
                }
            }

            return null;
        },

        supportsShippingTo: function (shippingCountry) {
            return !!this.getShippingCountryById(shippingCountry.$.id);
        }

    });


});