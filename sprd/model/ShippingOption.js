define(["sprd/data/SprdModel", "js/data/Entity", "sprd/entity/Price"], function (SprdModel, Entity, Price) {


    var ShippingCountry = Entity.inherit('sprd.model.ShippingOption.Country', {

    });

    var OptionCost = Entity.inherit('sprd.model.ShippingOption.OptionCost', {
        schema: {
            shippingCountry: ShippingCountry,
            price: Price
        }
    });

    return SprdModel.inherit('sprd.model.ShippingOption', {
        defaults: {

        },
        schema: {
            optionCosts: [OptionCost]
        },

        getPriceByShippingCountryCode: function (countryCode) {
            return this.$.optionCosts.find(function (optionCost) {
                return optionCost.get('shippingCountry.id') == countryCode;
            });
        }
    })
});