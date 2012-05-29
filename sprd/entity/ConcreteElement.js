define(["js/data/Entity", "sprd/model/Product", "sprd/model/Article"], function (Entity, Product, Article) {
    var TYPE_PRODUCT = "sprd:product";
    var TYPE_ARTICLE = "sprd:article";

    return Entity.inherit("sprd.entity.ConcreteElement",{
        defaults: {
            appearance: null,
            size: null,
            item: null
        },
        isEqual: function(concreteElement){
            return this.$.appearance === concreteElement.$.appearance &&
                this.$.size === concreteElement.$.size &&
                this.$.item === concreteElement.$.item;
        },
        getProduct: function(){
            if(this.$.item instanceof Product){
                return this.$.item;
            }else if(this.$.item instanceof Article){
                return this.$.item.$.product;
            }
            return null;
        },
        getType: function(){
            if (this.$.item instanceof Product) {
                return TYPE_PRODUCT;
            } else if (this.$.item instanceof Article) {
                return TYPE_ARTICLE;
            }
            return null;
        },


        parse: function (data, action, options) {


            if (data.type === TYPE_ARTICLE) {
                // TODO: determinate correct context
                data.item = this.$context.createEntity(Article, data.id);
            } else if (data.type === TYPE_PRODUCT) {
                // TODO: determinate correct context
                data.item = this.$context.createEntity(Product, data.id);
            } else {
                throw "Element type '" + data.type + "' not supported";
            }

            data.item.href = data.href;
            data.appearance = this.getPropertyByKey(data.properties, 'appearance').id;
            data.size = this.getPropertyByKey(data.properties, 'size').id;

            delete data.href;
            delete data.properties;

            return data;
        },

        prepare: function (action, options) {

            var data = this.$;

            return {
                    id: data.item.$.id,
                    type: this.getType(),
                    // TODO: build url like the datasource it does
                    href: data.item.$.href,
                    properties: [
                        {
                            key: "appearance",
                            value: data.appearance.id
                        },
                        {
                            key: "size",
                            value: data.size.id
                        }
                    ]
                }
        },

        getPropertyByKey: function(properties, key) {
            for (var i = 0; i < properties.length; i++) {
                var property = properties[i];
                if (property.key === key) {
                    return property;
                }
            }

            return null;
        }

    });
});
