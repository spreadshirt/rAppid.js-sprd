define(["sprd/data/SprdModel", "sprd/model/BasketItem", "js/data/Collection", "sprd/model/Currency", "js/data/Entity", "sprd/entity/Price", "sprd/model/DiscountScale", "sprd/model/Language"], function (SprdModel, BasketItem, Collection, Currency, Entity, Price, DiscountScale, Language) {

    var Discount = Entity.inherit('sprd.entity.BasketDiscount', {
        schema: {
            discountScale: DiscountScale
        }
    });

    return SprdModel.inherit("sprd.model.Basket", {

        schema: {
            basketItems: Collection.of(BasketItem),
            priceItems: Price,
            shop: "sprd/model/Shop",
            currency: Currency,
            language: Language,
            discounts: [Discount]
        },

        ctor: function () {
            this.callBase();

            this.bind('basketItems', 'change', this._triggerFunctions, this);
            this.bind('basketItems', 'add', this._triggerFunctions, this);
            this.bind('basketItems', 'remove', this._triggerFunctions, this);
        },

        addElement: function (element, quantity) {
            quantity = quantity || 1;

            var basketItem = this.getBasketItemForElement(element);
            if (basketItem) {
                basketItem.increaseQuantity(quantity);
            } else {
                basketItem = this.$.basketItems.createItem();
                basketItem.set({
                    element: element,
                    quantity: quantity
                });
                this.$.basketItems.add(basketItem);
            }

            return basketItem;
        },

        mergeBasketItem: function (basketItem) {
            var old, nItem;
            nItem = this.$.basketItems.find(function (item) {
                return (!nItem && item.$.element !== basketItem.$.element && item.$.element.isEqual(basketItem.$.element));
            });

            if (nItem) {
                this.$.basketItems.each(function (item) {
                    if (!old && item.$.element === basketItem.$.element) {
                        old = item;
                    }
                });
                nItem.increaseQuantity(old.$.quantity);
                this.$.basketItems.remove(old);
            }
        },

        getBasketItemForElement: function (element) {
            var basketItems = this.getCollection('basketItems');
            for (var i = 0; i < basketItems.$items.length; i++) {
                var basketItem = basketItems.$items[i];
                if (basketItem.$.element.isEqual(element)) {
                    return basketItem;
                }
            }
            return null;
        },

        _triggerFunctions: function () {
            this.trigger('change', {});
        },

        totalItemsCount: function () {
            var total = 0;
            if (this.$.basketItems) {
                this.$.basketItems.each(function (item) {
                    total += item.$.quantity;
                });
            }
            return total;
        }.on('change'),

        vatIncluded: function () {
            var total = 0;
            if (this.$.basketItems) {
                this.$.basketItems.each(function (item) {
                    total += item.totalVatIncluded();
                });
            }
            return total;
        }.on('change'),

        orderValue: function () {
            var total = 0;
            if (this.$.basketItems) {
                this.$.basketItems.each(function (item) {
                    total += item.orderValue();
                });
            }
            return total;
        }.on('change'),

        totalVat: function () {
            var total = 0;
            total = (this.vatIncluded() - this.vatExcluded());

            return total;
        }.on('change'),

        vatExcluded: function () {
            var total = 0;
            if (this.$.basketItems) {
                this.$.basketItems.each(function (item) {
                    total += item.totalVatExcluded();
                });
            }
            return total;
        }.on('change'),

        discountVatIncluded: function () {
            if (this.$.discounts && this.$.discounts.size()) {
                return this.$.discounts.at(0).get('price.vatIncluded');
            }

            return 0;
        }.onChange("discounts"),

        totalVatIncluded: function () {
            if (this.$.priceItems) {
                return this.$.priceItems.$.vatIncluded - this.discountVatIncluded();
            }
            return null;
        }.onChange('priceItems', 'discounts'),

        platformCheckoutLink: function () {
            if (this.$.links) {
                return this.$.links[2].href;
            }
            return null;
        }.onChange('links'),

        shopCheckoutLink: function () {
            if (this.$.links) {
                return this.$.links[1].href;
            }
            return null;
        }.onChange('links')

    });
});
