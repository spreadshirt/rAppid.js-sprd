define(['sprd/data/SprdModel', 'js/data/Collection', 'sprd/model/Currency', 'sprd/model/Address', 'sprd/model/Country'], function (SprdModel, Collection, Currency, Address, Country) {

    return SprdModel.inherit("sprd.model.AbstractShop", {

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
            return (platform === "EU" && id == 205909) || (platform === "NA" && id == 93439);
        }.onChange("platform", "id")

    });
});

