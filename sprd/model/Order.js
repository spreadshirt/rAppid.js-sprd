define(["sprd/data/SprdModel", "sprd/model/Shop", "sprd/model/OrderItem", "js/data/Collection", "sprd/model/Delivery", "sprd/entity/Price", "sprd/model/User"], function(SprdModel, Shop, OrderItem, Collection, Delivery, Price, User) {

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
            user: User,
            orderItems: Collection.of(OrderItem),
            billing: Delivery.Billing,
            shipping: Shipping,
            repayable: Boolean,
            priceTotal: Price
        },

        totalItemsCount: function() {
            var orderItems = this.$.orderItems;
            return orderItems ? orderItems.$items.length : 0;
        }.onChange("orderItems"),

        items: function() {
            return this.$.orderItems;
        }.onChange("orderItems"),

        subTotal: function(type) {
            return this.get('priceItems.' + type || "vatIncluded")
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