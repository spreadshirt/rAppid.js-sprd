define(["js/core/Component"], function (Component) {

    return Component.inherit('sprd.manager.IBasketManager', {

        defaults: {
            /***
             * continueShopping link is used in checkout as link for continue shopping button.
             * It will be automatically added to the element added to basket
             * @type String
             */
            continueShoppingLink: null,

            editBasketItemLinkHook: null,
            /***
             * edit link is the link displayed in checkout for editing the basket item.
             * It will be automatically added to the element added to the basked.
             *
             *
             * @type String
             */
            editBasketItemUrl: null
        },

        initBasket: function (callback) {

            var self = this;

            if (this.$basketInitialized) {
                callback && callback();
            } else {
                this._initBasket(function (err) {
                    if (!err) {
                        self.$basketInitialized = true;
                    }

                    callback && callback(err);
                });
            }

        },

        _initBasket: function (callback) {
            callback && callback();
        },

        /**
         *
         * @param {sprd.model.Coupon} coupon
         * @param {Function} callback
         */
        applyCoupon: function (coupon, callback) {
            throw "apply Coupon needs to be implemented"
        },

        addElementToBasket: function (element, quantity, callback) {
            callback && callback();
        },

        extendElementWithLinks: function (element) {
            var continueShoppingLink = this.$.continueShoppingLink;

            if (continueShoppingLink) {
                element.set("continueShoppingLink", continueShoppingLink);
            }

            if (!element.$.editLink) {
                var editBasketItemLinkHook = this.$.editBasketItemLinkHook,
                    editLink = null;

                if (editBasketItemLinkHook) {
                    editLink = editBasketItemLinkHook(element);
                }

                if (!editLink) {
                    editLink = this.buildItemEditLink();
                    if (editLink) {
                        element.set('editLink', editLink);
                    }
                }
            }
        },

        buildItemEditLink: function () {

            var editBasketItemUrl = this.$.editBasketItemUrl;

            if (editBasketItemUrl) {
                // clear edit basket item url from existing basketId and basketItemId query parameters
                editBasketItemUrl = editBasketItemUrl.replace(/&?basketId=[^=&]+/gi, "");
                editBasketItemUrl = editBasketItemUrl.replace(/&?basketItemId=[^=&]+/gi, "");

                var separator = "?";
                if (/\?(.*)/.test(editBasketItemUrl)) {
                    separator = "&";
                }
                return editBasketItemUrl + separator + "basketId={BASKET_ID}&basketItemId={BASKET_ITEM_ID}";
            }

            return null;
        }
    });


});