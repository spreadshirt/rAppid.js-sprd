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
        vatIncluded: function () {
            return this.get('element.item.price.vatIncluded');
        }.onChange('element'),
        vatExcluded: function () {
            return this.get('element.item.price.vatExcluded');
        }.onChange('element'),
        totalVatIncluded: function(){
            return this.vatIncluded() * this.$.quantity;
        }.onChange('element','quantity'),
        totalVatExcluded: function () {
            return this.vatExcluded() * this.$.quantity;
        }.onChange('element', 'quantity')
    });
});
