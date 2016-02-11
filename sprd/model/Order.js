define(["sprd/data/SprdModel", "sprd/model/Shop", "sprd/model/OrderItem", "js/data/Collection", "sprd/model/Delivery", "sprd/entity/Price"], function(SprdModel, Shop, OrderItem, Collection, Delivery, Price) {

    var Shipping = Delivery.Shipping.inherit("sprd.model.Order.Shipping", {
        schema: {
            price: Price,
            priceItem: Price
        }
    });

    return SprdModel.inherit('sprd.model.Order', {
        defaults: {
            shipping: null,
            orderItems: null,
            repayable: false
        },

        schema: {
            shop: Shop,
            orderItems: Collection.of(OrderItem),
            billing: Delivery.Billing,
            shipping: Shipping,
            repayable: Boolean,
            priceTotal: Price
        },

        items: function() {
            return this.$.orderItems;
        }.onChange("orderItems"),

        subTotal: function() {
            return this.get('priceItems.display')
        }.on('change'),

        vatIncluded: function () {
            var vatIncluded = 0;
            if (this.$.orderItems) {
                this.$.orderItems.each(function (orderItem) {
                    vatIncluded += orderItem.totalVatIncluded();
                });
            }
            return vatIncluded;
        }.onChange('orderItems'),

        totalVatIncluded: function () {
            return this.get('priceTotal.vatIncluded');
        }.onChange('priceTotal'),

        totalVatExcluded: function() {
            return this.get('priceTotal.vatExcluded');
        }.onChange('priceTotal'),

        totalVat: function () {
            return Math.max(0, (this.totalVatIncluded() - this.totalVatExcluded()) || 0);
        }.onChange('priceTotal')


    });
});