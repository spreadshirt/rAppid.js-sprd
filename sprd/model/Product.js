define(["sprd/data/SprdModel", 'js/core/List', 'sprd/model/ProductType'], function (SprdModel, List, ProductType) {
    return SprdModel.inherit("sprd.model.Product", {

        $schema: {
            productType: ProductType
        },

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
