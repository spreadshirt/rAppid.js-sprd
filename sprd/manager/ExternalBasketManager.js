define(["sprd/manager/IBasketManager", "flow"], function (IBasketManager, flow) {

    return IBasketManager.inherit('sprd.manager.ExternalBasketManager', {

        defaults: {
            externalBasket: null
        },

        addElementToBasket: function (element, quantity, callback) {
            var externalBasket = this.$.externalBasket;
            externalBasket.addBasketItem(element, quantity, callback);
        },

        saveBasket: function(cb) {
            cb && cb();
        },

        _initBasket: function (callback) {

            var basketImplementation = this.$stage.$parameter.basketImplementation;
            this.set("externalBasket", basketImplementation);

            flow()
                .seq(function() {
                    if (!basketImplementation) {
                        throw new Error("External basket implementation not found");
                    }
                })
                .exec(callback);
        }
    });


});