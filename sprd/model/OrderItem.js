define(['sprd/data/SprdModel', 'sprd/entity/Price', 'sprd/entity/ConcreteElement', 'sprd/model/Shop'], function (SprdModel, Price, ConcreteElement, Shop) {
    return SprdModel.inherit('sprd.model.OrderItem', {

        defaults: {
            quantity: 1,
            element: null,
            price: null
        },

        schema: {
            quantity: Number,
            price: Price,
            element: ConcreteElement,
            shop: Shop,
            origin: {
                type: Object,
                required: false
            }
        },

        totalVatIncluded: function () {
            return (this.get("price.vatIncluded")) * this.$.quantity;
        }.onChange("price.vatIncluded").on('change:quantity'),

        totalPrice: function(type) {
            return (this.get("price." + (type || "vatIncluded"))) * this.$.quantity;
        }.onChange("price.vatIncluded", "price.vatExcluded").on('change:quantity'),

        totalVatExcluded: function () {
            return (this.get("price.vatExcluded") || 0) * this.$.quantity;
        }.onChange("price.vatExcluded").on('change:quantity'),

        totalDisplayPrice: function() {
            return this.get('price.display') * this.$.quantity;
        }.on('change:quantity')
    });

});