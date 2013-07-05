define(["sprd/manager/IBasketManager", "flow", "sprd/model/Basket", "xaml!sprd/data/SprdApiDataSource", "js/data/LocalStorage", "js/data/Entity"], function (IBasketManager, flow, Basket, SprdApiDataSource, LocalStorage, Entity) {

    /***
     * @summary A BasketManager to interact with the Spreadshirt Basket API
     *
     * @see http://developer.spreadshirt.net/display/API/Basket+Resources
     */
    return IBasketManager.inherit('sprd.manager.ApiBasketManager', {

        defaults: {
            /***
             * the basket model
             * @type {sprd.model.Basket}
             */
            basket: null,

            /***
             * the id of the api basket which should try to be loaded.
             * If the id isn't set the id is retrieved from the local storage or generated by the api
             * after the basket has been created successfully. The id is written back to this property.
             */
            apiBasketId: null,

            /***
             * the shop used for creating a new basket
             * @type {sprd.model.Shop}
             */
            shop: null,

            /***
             * continueShopping link is used in checkout as link for continue shopping button.
             * It will be automatically added to the element added to basket
             * @type String
             */
            continueShoppingLink: null,

            /***
             * edit link is the link displayed in checkout for editing the basket item.
             * It will be automatically added to the element added to the basked.
             *
             * The following values are replaced
             *
             *  + ${productId} - with the current productId
             *
             * @type String
             */
            editBasketItemLinkTemplate: null,

            /***
             * the origin id used for basked items
             * @type {Number|String}
             */
            originId: null
        },

        events: [
        /***
         * the basketChanged event is dispatched after the basket has been modified e.g. added, removed or updated an
         * BasketItem
         */
            "on:basketChanged",
            "on:basketUpdated"
        ],

        inject: {
            api: SprdApiDataSource,
            localStorage: LocalStorage
        },

        /**
         * Adds an element to the basket without savoing it
         * @param element
         * @param quantity
         */
        addElementToBasket: function (element, quantity) {

            if (this.$.basket) {
                var basketItem = this.$.basket.addElement(element, quantity);
                element = basketItem.$.element;

                var originId = this.$.originId;
                if (originId) {
                    basketItem.set('origin', new Entity({
                        id: originId
                    }));
                }

                var continueShoppingLink = this.$.continueShoppingLink;

                if (continueShoppingLink) {
                    element.set("continueShoppingLink", continueShoppingLink)
                }

                var editBasketItemLinkTemplate = this.$.editBasketItemLinkTemplate;
                if (editBasketItemLinkTemplate) {
                    element.set("editLink", editBasketItemLinkTemplate.replace("$productId", element.get("item.id")))
                }
            }
        },

        _triggerBasketChanged: function () {
            this.trigger("on:basketChanged", this.$.basket, this);
        },

        _triggerBasketUpdated: function () {
            this.trigger("on:basketUpdated", this.$.basket, this);
        },

        _initBasket: function (callback) {

            var api = this.$.api,
                localStorage = this.$.localStorage,
                basketId = this.$.apiBasketId,
                basket,
                self = this;

            basketId = basketId || localStorage.getItem("basketId");

            basket = api.createEntity(Basket, basketId);

            this.set({
                basket: basket,
                apiBasketId: basketId
            });

            var basketSaveCallback = function (err) {
                if (!err) {
                    self.set("apiBasketId", basketId);
                    self.$.localStorage.setItem("basketId", basket.$.id);
                    self._triggerBasketChanged();
                    fetchBasketDiscountScales(basket, callback);
                } else {
                    console.warn(err);
                    callback(err);
                }

            };

            var fetchBasketDiscountScales = function (basket, cb) {
                if (basket.$.discounts && basket.$.discounts.size()) {
                    var discount = basket.$.discounts.at(0);
                    if (discount && discount.$.discountScale) {
                        discount.$.discountScale.fetch(null, cb);
                    } else {
                        cb();
                    }
                } else {
                    cb();
                }
            };

            if (basket.isNew()) {

                basket.set({
                    shop: this.$.shop,
                    currency: this.get("shop.currency")
                });

                basket.save(null, basketSaveCallback);
            } else {
                flow()
                    .seq(function (cb) {
                        basket.fetch({
                            noCache: true,
                            fetchSubModels: ["currency"]
                        }, cb)
                    })
                    .seq(function (cb) {
                        fetchBasketDiscountScales(basket, cb);
                    })
                    .exec(function (err) {
                        if (err) {
                            // something went wrong
                            basket.set('id', undefined);
                            basket.save(null, basketSaveCallback);
                            console.warn(err)
                        } else {

                            self.set("shop", basket.$.shop);

                            flow()
                                .parEach(basket.$.basketItems.toArray(), function (item, cb) {
                                    item.$.element.getProduct().fetch({
                                        fetchSubModels: ["productType"]
                                    }, cb);
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
        saveBasketItem: function (basketItem) {
            var self = this;
            this.$itemSaveTimeout && clearTimeout(this.$itemSaveTimeout);


            this.$itemSaveTimeout = setTimeout(function () {
                basketItem.save(null, function () {
                    self.$.basket.fetch({noCache: true});
                });
                self._triggerBasketChanged();
            }, 300);
        },

        /**
         *
         * @param {sprd.model.BasketItem} basketItem
         */
        removeBasketItem: function (basketItem) {
            this.$.basket.$.basketItems.remove(basketItem);
            this.saveBasket();
        },

        saveBasket: function () {
            this._debounceFunctionCall(this._saveBasket, "saveBasketCall", 700, this);
        },

        _saveBasket: function () {
            if (!this.$savingBasket) {
                var self = this;
                this.$callSaveBasketAgain = false;
                this.$savingBasket = true;
                this.$.basket.save(null, function (err, basket) {
                    self._triggerBasketChanged();
                    if (!err) {
                        basket.fetch({noCache: true}, function (err) {
                            self.$savingBasket = false;
                            if (!err) {
                                if (self.$callSaveBasketAgain) {
                                    self.saveBasket();
                                } else {
                                    self._triggerBasketUpdated();
                                }
                            }
                        });
                    } else {
                        self.$savingBasket = false;
                    }
                });
            } else {
                this.$callSaveBasketAgain = true;
            }
        }
    });

});