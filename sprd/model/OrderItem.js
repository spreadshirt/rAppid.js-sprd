define(['sprd/data/SprdModel', 'sprd/entity/Price', 'sprd/entity/ConcreteElement'], function (SprdModel, Price, ConcreteElement) {
    return SprdModel.inherit('sprd.model.OrderItem', {

        defaults: {
            quantity: 1,
            element: null,
            price: null
        },

        schema: {
            quantity: Number,
            price: Price,
            element: ConcreteElement
        },

        totalVatIncluded: function () {
            return (this.get("price.vatIncluded")) * this.$.quantity;
        }.onChange("price.vatIncluded").on('change:quantity'),

        totalVatExcluded: function () {
            return (this.get("price.vatExcluded") || 0) * this.$.quantity;
        }.onChange("price.vatExcluded").on('change:quantity')
    });

});