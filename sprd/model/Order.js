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

        totalVat: function () {
            return this.get('priceTotal.totalVat');
        }.onChange('priceTotal')


    });
});