define(["sprd/manager/IBasketManager", "flow", "sprd/model/Basket", "xaml!sprd/data/SprdApiDataSource", "js/data/LocalStorage"], function (IBasketManager, flow, Basket, SprdApiDataSource, LocalStorage) {

    return IBasketManager.inherit('sprd.manager.ApiBasketManager', {

        defaults: {
            basket: null
        },

        inject: {
            api: SprdApiDataSource,
            localStorage: LocalStorage
        },

        addElementToBasket: function (element, quantity, callback) {

            if (this.$.basket) {
                var basketItem = this.$.basket.addElement(element, quantity);
                basketItem.save({
                    invalidatePageCache: false
                }, callback);
            }
        },

        _initBasket: function (callback) {

            var api = this.$.api,
                localStorage = this.$.localStorage,
                basketId = localStorage.getItem("basketId"),
                basket = api.createEntity(Basket, basketId),
                self = this;

            this.set('basket', basket);

            var basketSaveCallback = function (err) {
                if (!err) {
                    self.$.localStorage.setItem("basketId", basket.$.id);
                } else {
                    console.warn(err);
                }
                callback(err);
            };

            if (basket.isNew()) {
                basket.save(null, basketSaveCallback);
            } else {
                basket.fetch({noCache: true}, function (err) {
                    if (err) {
                        // something went wrong
                        basket.set('id', undefined);
                        basket.save(null, basketSaveCallback);
                        console.warn(err)
                    } else {
                        flow()
                            .parEach(basket.$.basketItems.toArray(), function (item, cb) {
                                item.$.element.getProduct().fetch({fetchSubModels: ["productType"]}, cb);
                            })
                            .exec(callback);
                    }
                });
            }
        },
        /**
         *
         * @param {sprd.model.BasketItem} basketItem
         */
        saveBasketItem: function(basketItem){
            this.$itemSaveTimeout && clearTimeout(this.$itemSaveTimeout);

            this.$itemSaveTimeout = setTimeout(function(){
                basketItem.save();
            },300);
        },

        /**
         *
         * @param {sprd.model.BasketItem} basketItem
         */
        removeBasketItem: function(basketItem){
            basketItem.remove();
            this.$.basket.$.basketItems.remove(basketItem);
        }
    });


});