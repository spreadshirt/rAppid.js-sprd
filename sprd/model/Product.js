define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.Product", {
        price: function () {
            // TODO format price with currency
            return this.$.price.vatIncluded;
        }
    });
});
