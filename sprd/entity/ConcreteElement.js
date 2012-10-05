define(["js/data/Entity", "sprd/model/Product", "sprd/model/Article", "sprd/entity/Appearance"], function (Entity, Product, Article, Appearance) {
    var TYPE_PRODUCT = "sprd:product";
    var TYPE_ARTICLE = "sprd:article";

    return Entity.inherit("sprd.entity.ConcreteElement",{
        schema: {
            appearance: Appearance,
            size: Entity
        },

        defaults: {
            appearance: null,
            size: null,
            item: null
        },

        isEqual: function(concreteElement){
            return this.get('appearance.id') === concreteElement.get('appearance.id') &&
                this.get('size.id')  === concreteElement.get('size.id') &&
                this.get('item.id') === concreteElement.get('item.id');
        },

        getProduct: function(){
            if(this.$.item instanceof Product){
                return this.$.item;
            }else if(this.$.item instanceof Article){
                return this.$.item.$.product;
            }
            return null;
        }.on(['item','change:product']),

        getArticle: function() {
            if (this.$.item instanceof Article) {
                return this.$.item;
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

        sku: function() {
            return [ (this.getType() === TYPE_PRODUCT ? 'P' : 'A') + this.get('item.id'),
                this.get('appearance.id'),
                this.get('size.id')].join(' - ');
        }

    });
});
