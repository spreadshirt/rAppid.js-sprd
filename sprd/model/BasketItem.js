define(["sprd/data/SprdModel", "sprd/entity/ConcreteElement", "sprd/entity/Price"], function (SprdModel, ConcreteElement, Price) {
    return SprdModel.inherit("sprd.model.BasketItem", {

        schema: {
            element: ConcreteElement,
            quantity: Number,
            price: Price,
            priceItem: Price,
            origin: String,
            shippingFactor: Number,
            giftWrappingSupported: Boolean
        },

        defaults: {
            quantity: 1,
            element: null,
            price: null,
            shippingFactor: 1
        },

        increaseQuantity: function (quantity) {
            quantity = quantity || 1;
            this.set('quantity', this.$.quantity + quantity);
        },

        decreaseQuantity: function (quantity) {
            quantity = quantity || 1;
            this.set('quantity', this.$.quantity - quantity);
        },

        _updatePrices: function () {
            this.totalVatIncluded.trigger();
            this.totalVatExcluded.trigger();
        },

        vatIncluded: function () {
            if (this.$.priceItem) {
                return this.$.priceItem.$.vatIncluded;
            }

            return (this.get('element.item.price().vatIncluded') || 0) +
                (this.get('element.article.commission.vatIncluded') || 0);
        },

        vatExcluded: function () {
            if (this.$.priceItem) {
                return this.$.priceItem.$.vatExcluded;
            }

            return (this.get('element.item.price().vatExcluded') || 0) + +
                (this.get('element.article.commission.vatExcluded') || 0);
        },

        displayPrice: function(){
            if (this.$.priceItem) {
                return this.$.priceItem.$.display;
            }

            return this.vatIncluded();
        },

        orderValue: function() {
            return (this.totalVatIncluded() || 0) * (this.$.shippingFactor);
        },

        discountPriceVatIncluded: function(){
            if(this.$.price){
                return this.$.price.$.vatIncluded;
            }
            return 0;
        }.onChange("price"),

        totalVatIncluded: function () {
            return this.vatIncluded() * this.$.quantity;
        }.on('change:quantity'),

        totalVatExcluded: function () {
            return this.vatExcluded() * this.$.quantity;
        }.on('change:quantity'),

        totalDisplayPrice: function(){
            return this.displayPrice() * this.$.quantity;
        }.on('change:quantity'),

        totalDiscountVatIncluded: function(){
            return this.discountPriceVatIncluded() * this.$.quantity;
        }.onChange("price","quantity")

    });
});
