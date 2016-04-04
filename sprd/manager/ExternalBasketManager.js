define(["sprd/manager/IBasketManager", "flow", "designer/manager/PriceCalculator"], function (IBasketManager, flow, PriceCalculator) {

    return IBasketManager.inherit('sprd.manager.ExternalBasketManager', {

        defaults: {
            externalBasket: null,
            basketItem: null
        },

        inject: {
            priceCalculator: PriceCalculator
        },

        addElementToBasket: function (element, quantity, callback) {
            var externalBasket = this.$.externalBasket;

            this.extendElementWithLinks(element);


            var product = element.getProduct(),
                originalPriceFunction = product.price,
                priceCalculator = this.$.priceCalculator;

            if (!product.price.rewritten) {
                product.price.rewritten = true;
                product.price = function() {
                    var price = originalPriceFunction.call(product);

                    var rewrittenPrice = product.price;
                    product.price = originalPriceFunction;

                    price.set({
                        vatIncluded: priceCalculator.getTotalPrice(product, 1)
                    });

                    product.price = rewrittenPrice;

                    return price;
                };



            }


            externalBasket.addBasketItem(element, quantity, callback);
        },

        updateBasketItem: function (basketItem, element, quantity, cb) {
            this.extendElementWithLinks(element);

            basketItem.set({
                element: element,
                quantity: quantity
            });

            var externalBasket = this.$.externalBasket;
            basketItem.save(null, function (err) {
                if (!err) {
                    if (externalBasket && externalBasket.onBasketItemUpdated) {
                        externalBasket.onBasketItemUpdated(basketItem);
                    }
                }
                cb(err);
            });

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