define(['sprd/model/processor/DefaultProcessor','sprd/model/Shop','sprd/model/Article','sprd/model/Product'], function(DefaultProcessor, Shop, Article, Product) {
    var TYPE_PRODUCT = "sprd:product";
    var TYPE_ARTICLE = "sprd:article";

    return DefaultProcessor.inherit("sprd.model.processor.BasketItemProcessor", {
        parse: function(payload){
            var element = payload.element;

            var properties = element.properties, prop, elementPayload = {};
            for (var i = 0; i < properties.length; i++) {
                prop = properties[i];
                if (prop.key === "size" || prop.key === "appearance") {
                    elementPayload[prop.key] = {
                        id: prop.value
                    }
                }
            }

            var shop = this.$datasource.createEntity(Shop, payload.shop.id);

            if (element.type === TYPE_ARTICLE) {
                // TODO: determinate correct context
                elementPayload.item = this.$datasource.getContextForChild(Article,shop).createEntity(Article, element.id);
                elementPayload.item.fetch();
            } else if (element.type === TYPE_PRODUCT) {
                // TODO: determinate correct context
                elementPayload.item = this.$datasource.getContextForChild(Product, shop).createEntity(Product, element.id);
                elementPayload.item.fetch();
            } else {
                throw "Element type '" + data.type + "' not supported";
            }

            payload['element'] = elementPayload;

            return this.callBase();
        }
    });
});