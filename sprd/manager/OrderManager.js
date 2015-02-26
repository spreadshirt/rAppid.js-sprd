define(["js/core/Component", "flow"], function(Component, flow) {

    return Component.inherit('sprd.manager.OrderManager', {

        defaults: {
            /***
             * the order model
             * @type {sprd.model.Order}
             */
            order: null,

            shop: null
        },

        init: function(callback) {

            var self = this,
                order = this.$.order;

            flow()
                .seq(function(cb) {
                    order.fetch({
                        // fetchSubModels: ["currency"]
                    }, cb);
                })
                .exec(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        self.set("shop", order.$.shop);

                        flow()
                            .parEach(order.$.orderItems.toArray(), function(item, cb) {
                                flow()
                                    .seq(function(cb) {
                                        item.$.element.init(cb);
                                    })
                                    .seq(function(cb) {
                                        item.$.element.getProduct().fetch({
                                            fetchSubModels: ["productType"]
                                        }, cb);
                                    })
                                    .exec(cb);
                            })
                            .exec(function(err) {
                                callback && callback(err, order);
                            });
                    }
                });
        }
    });

});