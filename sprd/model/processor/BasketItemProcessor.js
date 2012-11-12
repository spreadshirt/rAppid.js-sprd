define(['sprd/model/processor/DefaultProcessor','sprd/model/Shop','sprd/model/Article','sprd/model/Product'], function(DefaultProcessor, Shop, Article, Product) {
    var TYPE_PRODUCT = "sprd:product";
    var TYPE_ARTICLE = "sprd:article";

    return DefaultProcessor.inherit("sprd.model.processor.BasketItemProcessor", {
        parse: function(model, payload, action, options){
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

            var shop = this.$dataSource.createEntity(Shop, payload.shop.id);

            if (element.type === TYPE_ARTICLE) {
                elementPayload.item = this.$dataSource.getContextForChild(Article,shop).createEntity(Article, element.id);
                elementPayload.item.fetch({
                    fetchSubModels: ['product/productType']
                });
            } else if (element.type === TYPE_PRODUCT) {
                elementPayload.item = this.$dataSource.getContextForChild(Product, shop).createEntity(Product, element.id);
                elementPayload.item.fetch({
                    fetchSubModels: ['productType']
                });
            } else {
                throw "Element type '" + element.type + "' not supported";
            }
            elementPayload.item.set('price',payload.price);


            payload['element'] = elementPayload;

            return this.callBase(model, payload, action, options);
        },
        compose: function(model){
            var payload = this.callBase();

            var element = payload.element;
            var elementPayload = {};
            elementPayload['properties'] = [
                {key: "appearance", value: element.appearance.id},
                {key: "size", value: element.size.id}
            ];



            elementPayload["type"] = model.$.element.getType();
            elementPayload["href"] = element.item.href;
            elementPayload["id"] = element.item.id;

            return {
                element: elementPayload,
                quantity: payload.quantity
            };
        }
    });
});