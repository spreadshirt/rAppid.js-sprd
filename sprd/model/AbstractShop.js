define(['sprd/data/SprdModel', 'js/data/Collection', 'sprd/model/Currency', 'sprd/model/Address', 'sprd/model/Country'], function (SprdModel, Collection, Currency, Address, Country) {

    var MarketPlace = {
        EU: 205909,
        NA: 93439
    };


    var AbstractShop = SprdModel.inherit("sprd.model.AbstractShop", {

        defaults: {
            platform: null
        },

        schema: {

            address: Address,
            country: Country,
            currency: Currency,

            currencies: Collection.of(Currency),
            countries: Collection.of(Country),

            name: String,
            description: String,
            user: "sprd/model/User",
            discountSupported: Boolean

        },

        isMarketPlace: function () {
            var platform = this.$.platform,
                id = this.$.id;
            return (platform === "EU" && id == MarketPlace.EU) || (platform === "NA" && id == MarketPlace.NA);
        }.onChange("platform", "id")

    }, {

        marketPlaceShopId: function (platform) {
            return MarketPlace[platform.toUpperCase()];
        }

    });

    AbstractShop.MarketPlace = MarketPlace;

    return AbstractShop;
});

