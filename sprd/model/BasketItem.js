define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.BasketItem",{
        defaults: {
            quantity: 1,
            element: null
        },
        increaseQuantity: function(quantity) {
            this.set('quantity', quantity + this.$.quantity);
        },
        vatIncluded: function(){
            return this.$.element.$.item.$.price.vatIncluded * this.$.quantity;
        }.onChange('element','quantity'),
        vatExcluded: function () {
            return this.$.element.$.item.$.price.vatExcluded * this.$.quantity;
        }.onChange('element', 'quantity')
    });
});
