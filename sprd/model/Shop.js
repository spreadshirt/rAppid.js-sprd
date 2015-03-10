define(['sprd/model/AbstractShop', 'js/data/Collection',
        'sprd/model/Basket',
        'sprd/model/Design',
        'sprd/model/ProductType',
        'sprd/model/ProductTypeDepartment',
        'sprd/model/ArticleCategory',
        'sprd/model/DesignCategory',
        'sprd/model/Article',
        'sprd/model/PrintType',
        'sprd/model/FontFamily',
        "sprd/model/Product",
        "sprd/model/DiscountScale",
        'sprd/model/Application'
    ],
    function (AbstractShop, Collection, Basket, Design, ProductType, ProductTypeDepartment, ArticleCategory, DesignCategory, Article, PrintType, FontFamily, Product, DiscountScale, Application) {

        return AbstractShop.inherit("sprd.model.Shop", {

            schema: {

                productTypes: Collection.of(ProductType),
                printTypes: Collection.of(PrintType),
                fontFamilies: Collection.of(FontFamily),
                productTypeDepartments: Collection.of(ProductTypeDepartment),

                designCategories: Collection.of(DesignCategory),
                designs: Collection.of(Design),
                articleCategories: Collection.of(ArticleCategory),
                articles: Collection.of(Article),

                discountScale: DiscountScale,
                products: Collection.of(Product),

                applications: Collection.of(Application)

            }
        });
    });

