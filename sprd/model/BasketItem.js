define(["sprd/data/SprdModel", "sprd/entity/ConcreteElement"], function (SprdModel, ConcreteElement) {
    return SprdModel.inherit("sprd.model.BasketItem",{

        $schema: {
            element: ConcreteElement
        },

        defaults: {
            quantity: 1,
            element: null,
            price: null
        },
        _commitElement: function(){
            this.set('price', this.get('element.item.price'), {silent: true});
        },
        increaseQuantity: function(quantity) {
            this.set('quantity', quantity + this.$.quantity);
        },
        _updatePrices: function(){
            this.totalVatIncluded.trigger();
            this.totalVatExcluded.trigger();
        },
        vatIncluded: function(){
            return this.get('price.vatIncluded') || 0;
        },
        vatExcluded: function(){
            return this.get('price.vatExcluded') || 0;
        },
        totalVatIncluded: function(){
            return this.vatIncluded() * this.$.quantity;
        }.on('change:quantity'),
        totalVatExcluded: function () {
            return this.vatExcluded() * this.$.quantity;
        }.on('change:quantity'),
        prepare: function(){
            return {
                quantity: this.$.quantity,
                element: this.$.element,
                price: this.$.price
            }
        }
    });
});
