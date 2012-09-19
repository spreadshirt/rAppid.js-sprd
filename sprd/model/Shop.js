define([
    "sprd/data/SprdModel",
    'js/data/Collection',
    'sprd/model/Basket',
    'sprd/model/Currency',
    'sprd/model/Design',
    'sprd/model/ProductType',
    'sprd/model/ProductTypeDepartment',
    'sprd/model/ArticleCategory',
    'sprd/model/Article', 'sprd/model/User', 'sprd/model/Country', 'sprd/model/PrintType', 'sprd/model/FontFamily'],
    function (SprdModel, Collection, Basket, Currency, Design, ProductType, ProductTypeDepartment, ArticleCategory, Article, User, Country, PrintType, FontFamily) {

        return SprdModel.inherit("sprd.model.Shop", {
            $schema: {

                user: User,
                country: Country,
//            language: SprdModel,
                currency: Currency,
//            address: SprdModel,

                productTypes: Collection.of(ProductType),
                printTypes: Collection.of(PrintType),
                fontFamilies: Collection.of(FontFamily),
                productTypeDepartments: Collection.of(ProductTypeDepartment),
//            shippingTypes: Collection,
//            designCategories: Collection,
                designs: Collection.of(Design),
            articleCategories: Collection.of(ArticleCategory),
                articles: Collection.of(Article),
//            products: Collection,
//            applications: Collection,
                currencies: Collection.of(Currency),
//            languages: Collection,
                countries: Collection.of(Country),
                baskets: Collection.of(Basket)

            }
        });
    });

