define(["sprd/model/AbstractShop"], function (Shop) {
    return Shop.inherit("sprd.model.Shop", {

        defaults: {
            platform: null
        },

        isMarketPlace: function() {
            var platform = this.$.platform,
                id = this.$.id;
            return (platform === "EU" && id == 205909) || (platform === "NA" && id == 93439);
        }.onChange("platform", "id")
    });
});

