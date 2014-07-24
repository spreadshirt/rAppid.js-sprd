define(["sprd/data/SprdModel", "sprd/model/Shop", "sprd/model/OrderItem", "js/data/Collection", "sprd/model/Delivery"], function (SprdModel, Shop, OrderItem, Collection, Delivery) {
    return SprdModel.inherit('sprd.model.Order', {

        schema: {
            shop: Shop,
            orderItems: Collection.of(OrderItem),
            billing: Delivery.Billing
        }

    });
});