define(["sprd/manager/IBasketManager", "flow"], function (IBasketManager, flow) {

    return IBasketManager.inherit('sprd.manager.ExternalBasketManager', {

        defaults: {
            externalBasket: null,
            basketItem: null
        },

        addElementToBasket: function (element, quantity, callback) {
            var externalBasket = this.$.externalBasket;

            this.extendElementWithLinks(element);

            externalBasket.addBasketItem(element, quantity, callback);
        },

        updateBasketItem: function (basketItem, element, quantity, cb) {
            var externalBasket = this.$.externalBasket;

            if (externalBasket && externalBasket.updateBasketItem) {
                externalBasket.updateBasketItem(basketItem, element, quantity, cb);
            }
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