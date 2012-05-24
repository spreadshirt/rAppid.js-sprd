define(["sprd/data/SprdModel", "sprd/entity/ConcreteElement"], function (SprdModel, ConcreteElement) {
    return SprdModel.inherit("sprd.model.BasketItem",{

        $schema: {
            element: ConcreteElement
        },

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
