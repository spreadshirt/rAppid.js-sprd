define(["sprd/data/SprdModel", "js/data/Entity", "sprd/model/Shop", "checkout/model/CheckoutBasket", "sprd/model/ShippingType", "sprd/model/ShippingOption", "sprd/model/Product", "sprd/model/Currency", "sprd/model/Article", "sprd/model/ProductType"], function(SprdModel, Entity, Shop, Basket, ShippingType, ShippingOption, Product, Currency, Article, ProductType) {

    var ProductTypeList = Entity.inherit("sprd.model.CombinedBasket.ProductTypeList", {
        schema: {
            productTypes: [ProductType]
        }
    });


    var ArticlesList = Entity.inherit("sprd.model.CombinedBasket.ArticlesList", {
        schema: {
            articles: [Article]
        }
    });


    var ProductsList = Entity.inherit("sprd.model.CombinedBasket.ProductsList", {
        schema: {
            products: [Product]
        }
    });

    var ShippingTypeList = Entity.inherit("sprd.model.CombinedBasket.ShippingTypeList", {
        schema: {
            shippingTypes: [ShippingType]
        }
    });

    var ShippingOptionList = Entity.inherit("sprd.model.CombinedBasket.ShippingTypeList", {
        schema: {
            shippingOptions: [ShippingOption]
        }
    });

    return SprdModel.inherit("sprd.model.CombinedBasket", {

        schema: {
            basket: Basket,
            shop: Shop,
            currency: Currency,
            shippingTypes: ShippingTypeList,
            shippingOptions: ShippingOptionList,
            productTypes: ProductTypeList,
            articles: ArticlesList,
            products: ProductsList
        }

    });
});