define(["sprd/data/SprdModel", 'js/data/Collection', 'sprd/model/Basket', 'sprd/model/Currency', 'sprd/model/Design', 'sprd/model/ProductType'],
    function (SprdModel, Collection, Basket, Currency, Design, ProductType) {

    return SprdModel.inherit("sprd.model.Shop", {
        $schema: {

            user: SprdModel,
            country: SprdModel,
            language: SprdModel,
            currency: Currency,
            address: SprdModel,

            productTypes: Collection.of(ProductType),
            printTypes: Collection,
            fontFamilies: Collection,
            productTypeDepartments: Collection,
            shippingTypes: Collection,
            designCategories: Collection,
            designs: Collection.of(Design),
            articleCategories: Collection,
            articles: Collection,
            products: Collection,
            applications: Collection,
            currencies: Collection.of(Currency),
            languages: Collection,
            countries: Collection,
            baskets: Collection.of(Basket)

        },

        getContextForChildren: function(childFactory) {

            if (!childFactory.prototype.$cacheInRootContext) {
                return this.$context.$datasource.getContext({
                    shopId: this.$.id
                });
            }

            return this.callBase();
        }
    });
});

