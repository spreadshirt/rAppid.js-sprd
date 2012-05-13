define(["sprd/data/SprdModel", "sprd/model/ConcreteArticle"], function (SprdModel, ConcreteArticle) {
    return SprdModel.inherit("sprd.model.BasketItem",{
        defaults: {
            quantity: 1
        },
        increaseQuantity: function(quantity) {
            this.set('quantity', quantity + this.$.quantity);
        },
        vatIncluded: function(){
            return this.$.concreteArticle.$.article.$.price.vatIncluded * this.$.quantity;
        }.onChange('concreteArticle','quantity'),
        vatExcluded: function () {
            return this.$.concreteArticle.$.article.$.price.vatExcluded * this.$.quantity;
        }.onChange('concreteArticle', 'quantity')
    });
});
