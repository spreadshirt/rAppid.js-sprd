define(['sprd/model/processor/DefaultProcessor'], function (DefaultProcessor) {

    return DefaultProcessor.inherit("sprd.model.processor.BasketProcessor", {

        compose: function (model) {

            var payload = this.callBase();

            var basketItems = model.$.basketItems,
                composedItems = [];
            if (basketItems) {
                var self = this;
                basketItems.each(function (basketItem) {
                    composedItems.push(self.$dataSource.composeModel(basketItem));
                });
                payload.basketItems = composedItems;
            }


            return payload;

        },

        parse: function() {
            var ret = this.callBase();
            ret.delivery = ret.delivery || {
                id: "delivery"
            };
            return  ret;
        }

    });
});