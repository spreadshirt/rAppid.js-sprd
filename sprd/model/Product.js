define(["sprd/data/SprdModel", 'js/core/List'], function (SprdModel, List) {
    return SprdModel.inherit("sprd.model.Product", {

        defaults: {
            productType: null,
            configurations: List
        },

        price: function () {
            // TODO format price with currency
            return this.$.price.vatIncluded;
        },
        getDefaultView: function () {
            if (this.$.defaultValues && this.$.productType) {
                return this.$.productType.getViewById(this.$.defaultValues.defaultView.id);
            }
            return null;
        }
    });
});
