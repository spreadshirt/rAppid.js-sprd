define(["js/data/Entity", "sprd/model/Product", "sprd/model/Article", "sprd/entity/Appearance"], function (Entity, Product, Article, Appearance) {
    var TYPE_PRODUCT = "sprd:product";
    var TYPE_ARTICLE = "sprd:article";

    return Entity.inherit("sprd.entity.ConcreteElement", {
        schema: {
            appearance: Appearance,
            size: Entity
        },

        defaults: {
            /***
             * the appearance of the basket item
             * @type sprd.entity.Appearance
             */
            appearance: null,
            /***
             * the size of the basket item
             * @type sprd.entity.ProductTypeSize
             */
            size: null,

            /***
             * the basket item
             * @type {sprd.model.Product|sprd.model.Article}
             */
            item: null,

            /***
             * continueShopping link is used in checkout as link for continue shopping button.
             * @type String
             */
            continueShoppingLink: null,

            /***
             * edit link is the link displayed in checkout for editing the basket item
             * @type String
             */
            editLink: null,

            /***
             * the base article
             * @type sprd.model.Article
             */
            article: null
        },

        isEqual: function (concreteElement) {
            return this.get('appearance.id') === concreteElement.get('appearance.id') &&
                this.get('size.id') === concreteElement.get('size.id') &&
                this.get('item.id') === concreteElement.get('item.id');
        },

        init: function (callback) {
            this.$.item.fetch(null, callback);
        },

        getProduct: function () {
            if (this.$.item instanceof Product) {
                return this.$.item;
            } else if (this.$.item instanceof Article) {
                return this.$.item.$.product;
            }
            return null;
        }.on(['item', 'change:product']).onChange('item'),

        getArticle: function () {
            if (this.$.item instanceof Article) {
                return this.$.item;
            }
            return null;
        },

        getSize: function(){
            if(this.$.size){
                return this.getProduct().$.productType.getSizeById(this.$.size.$.id);
            }
            return null;
        },

        getAppearance: function(){
            if(this.$.appearance){
                return this.getProduct().$.productType.getAppearanceById(this.$.appearance.$.id);
            }
            return null;
        },

        getType: function () {
            if (this.$.item instanceof Product) {
                return TYPE_PRODUCT;
            } else if (this.$.item instanceof Article) {
                return TYPE_ARTICLE;
            }
            return null;
        },

        uniqueId: function () {
            return (this.getType() === TYPE_PRODUCT ? 'P' : 'A') + this.get('item.id');
        },

        sku: function () {
            return [ this.get('getProduct().productType.id'),
                this.get('appearance.id'),
                this.get('size.id')].join(' - ');
        }

    });
});
