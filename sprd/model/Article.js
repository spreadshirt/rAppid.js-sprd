define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit({
        price: function() {
            // TODO format price with currency
            return this.$.price.vatIncluded;
        }
    });
});
