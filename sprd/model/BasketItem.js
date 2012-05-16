define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.BasketItem",{
        defaults: {
            quantity: 1
        },
        increaseQuantity: function(quantity) {
            this.set('quantity', quantity + this.$.quantity);
        },
        vatIncluded: function(){
            return this.$.concreteProduct.$.item.$.price.vatIncluded * this.$.quantity;
        }.onChange('concreteArticle','quantity'),
        vatExcluded: function () {
            return this.$.concreteProduct.$.item.$.price.vatExcluded * this.$.quantity;
        }.onChange('concreteArticle', 'quantity')
    });
});
