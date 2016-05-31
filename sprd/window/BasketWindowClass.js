define(["js/core/Window", "sprd/manager/TrackingManager", "sprd/manager/ApiBasketManager",
        "js/core/History", "underscore", 'sprd/manager/FeatureManager', "js/core/I18n", "js/core/Bus"],
    function(Window, TrackingManager, ApiBasketManager, History, _, FeatureManager, I18n, Bus) {

    return Window.inherit("sprd.window.BasketWindowClass", {
        inject: {
            basketManager: ApiBasketManager,
            tracking: TrackingManager,
            history: History,
            featureManager: FeatureManager,
            i18n: I18n,
            context: "context",
            bus: Bus
        },

        defaults: {
            basket: "{basketManager.basket}",
            basketItems: null,
            componentClass: "basket-window {basketStatusClass()}",
            closable: false,
            updatingBasket: false,
            itemSwitch: '',
            openFromBasket: false
        },

        $events: ["on:checkout"],

        ctor: function () {
            this.callBase();

            this.bind("basketManager", "on:basketChanged", function () {
                var itemsCount = this.get("basket.basketItems.$items.length");

                if (itemsCount === 0) {
                    this._emptyBasket();
                }

            }, this);

            this.bind("basketManager", "on:basketUpdated", function () {
                this.set("updatingBasket", false);
            }, this);

            this.bind("basketManager", "on:basketUpdating", function(){
                this.set("updatingBasket", true);
            }, this);
        },

        /***
         * Hook to implement functional opening of basket item.
         * @param {type} basketItem
         * @param {type} callback
         */
        openBasketItem: function (basketItem, callback) {
            callback();
        },

        openBasketItemHandler: function (e, basketItem) {
            // HOOK:

            if (!this.$.openFromBasket) {
                return;
            }

                var self = this;
                var showLoading = e.$.showLoading;

                setTimeout(function() {
                    self.openBasketItem(e.$.basketItem, function() {
                        showLoading(false);
                    });

                }, 200);

                showLoading(true);
            },

        showVat: function () {
            return this.$stage.$parameter.platform !== "NA";
        },

        showVatInfo: function () {
            // HOOK: Will be overwritten.
        },

        showShippingInfo: function () {
            // HOOK: Will be overwritten.
        },

        toUpperCase: function (str) {
            if (str) {
                return str.toUpperCase();
            }
            return str;
        },

        checkout: function () {
            this.trigger("on:checkout");
        },

        checkoutEnabled: function() {
            return !this.$.updatingBasket && this.get("basket.basketItems.$items.length");
        }.onChange("updatingBasket", "basket.basketItems.$items.length"),

        basketStatusClass: function () {
            return this.$.updatingBasket ? "updating" : "";
        }.onChange("updatingBasket"),

        _emptyBasket: function () {
            // HOOK: Will be overridden.
        },

            start: function(callback) {
                var self = this;
                this.$.basketManager.initBasket(function(err) {
                    if (!err) {
                        self.set('basketItems', self.$.basket.$.basketItems);

                        var itemsCount = self.get(self.$.basket.$.basketItems, "$items.length");
                        if (itemsCount === 0) {
                            self._emptyBasket();
                        }
                    }

                    callback && callback(err);
                });
            }
        });
    });