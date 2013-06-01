define(["sprd/data/SprdModel", "sprd/entity/ConcreteElement"], function (SprdModel, ConcreteElement) {
    return SprdModel.inherit("sprd.model.BasketItem",{

        schema: {
            element: ConcreteElement,
            quantity: Number,
            price: Object,
            origin: String
        },

        defaults: {
            quantity: 1,
            element: null,
            price: null
        },

        increaseQuantity: function(quantity) {
            quantity = quantity || 1;
            this.set('quantity', this.$.quantity + quantity);
        },

        decreaseQuantity: function(quantity){
            quantity = quantity || 1;
            this.set('quantity', this.$.quantity - quantity);
        },

        _updatePrices: function(){
            this.totalVatIncluded.trigger();
            this.totalVatExcluded.trigger();
        },

        vatIncluded: function(){
            return this.get('element.item.price().vatIncluded') || 0;
        },

        vatExcluded: function(){
            return this.get('element.item.price().vatExcluded') || 0;
        },

        totalVatIncluded: function(){
            return this.vatIncluded() * this.$.quantity;
        }.on('change:quantity'),

        totalVatExcluded: function () {
            return this.vatExcluded() * this.$.quantity;
        }.on('change:quantity')
    });
});
