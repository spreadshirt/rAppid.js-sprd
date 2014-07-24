define(["sprd/data/SprdModel", "sprd/model/Shop", "sprd/model/OrderItem", "js/data/Collection"], function (SprdModel, Shop, OrderItem, Collection) {
    return SprdModel.inherit('sprd.model.Order', {

        schema: {
            shop: Shop,
            orderItems: Collection.of(OrderItem)
        }

    });
});