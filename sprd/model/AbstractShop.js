define([
    "sprd/data/SprdModel",
    'js/data/Collection',
    'sprd/model/Basket',
    'sprd/model/Currency',
    'sprd/model/Design',
    'sprd/model/ProductType',
    'sprd/model/ProductTypeDepartment',
    'sprd/model/ArticleCategory',
    'sprd/model/DesignCategory',
    'sprd/model/Article', 'sprd/model/Country', 'sprd/model/PrintType', 'sprd/model/FontFamily', "sprd/model/Product"],
    function (SprdModel, Collection, Basket, Currency, Design, ProductType, ProductTypeDepartment, ArticleCategory, DesignCategory, Article, Country, PrintType, FontFamily, Product) {

        return SprdModel.inherit("sprd.model.Shop", {
            schema: {


                country: Country,
//            language: SprdModel,
                currency: Currency,
//            address: SprdModel,

                productTypes: Collection.of(ProductType),
                printTypes: Collection.of(PrintType),
                fontFamilies: Collection.of(FontFamily),
                productTypeDepartments: Collection.of(ProductTypeDepartment),
//            shippingTypes: Collection,
            designCategories: Collection.of(DesignCategory),
                designs: Collection.of(Design),
                articleCategories: Collection.of(ArticleCategory),
                articles: Collection.of(Article),
                products: Collection.of(Product),
//            applications: Collection,
                currencies: Collection.of(Currency),
//            languages: Collection,
                countries: Collection.of(Country),
                baskets: Collection.of(Basket)

            }
        });
    });

