define(["sprd/data/SprdModel", "sprd/model/BasketItem", "js/data/Collection", "sprd/model/Currency", "js/data/Entity", "sprd/entity/Price", "sprd/model/DiscountScale", "sprd/model/Language"], function (SprdModel, BasketItem, Collection, Currency, Entity, Price, DiscountScale, Language) {

    var Discount = Entity.inherit('sprd.entity.BasketDiscount', {
        schema: {
            discountScale: DiscountScale,
            price: Price,
            type: String
        }
    });

    return SprdModel.inherit("sprd.model.Basket", {

        schema: {
            supportsEmailShipping: Boolean,
            basketItems: Collection.of(BasketItem),
            priceItems: Price,
            priceTotal: Price,
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

        items: function () {
            return this.$.basketItems
        }.onChange("basketItems"),

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
            return (this.totalVatIncluded() - this.totalVatExcluded()) || 0;
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
            var discount = this.getDiscount("scale");
            if (discount) {
                return discount.get("price.vatIncluded")
            }

            return 0;
        }.onChange("discounts"),

        totalVatIncluded: function () {
            if (this.$.priceTotal) {
                return this.$.priceTotal.$.vatIncluded;
            }
            return null;
        }.onChange('priceTotal'),

        totalVatExcluded: function () {
            if (this.$.priceTotal) {
                return this.$.priceTotal.$.vatExcluded;
            }
            return null;
        }.onChange('priceTotal'),


        totalPriceItemsVatIncluded: function () {
            if (this.$.priceItems) {
                return this.$.priceItems.$.vatIncluded - this.discountVatIncluded();
            }
            return null;
        }.onChange('priceItems', 'discounts'),

        totalPriceItemsDisplay: function () {
            if (this.$.priceItems) {
                return this.$.priceItems.$.display - this.discountVatIncluded();
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
        }.onChange('links'),

        getDiscount: function (type) {
            type = type || "scale";

            var discounts = this.$.discounts;
            if (!discounts) {
                return null;
            }

            return discounts.find(function (discount) {
                return discount.$.type == type
            });
        }.onChange("discounts"),

        getGoodsDiscountPrice: function () {
            var discounts = this.$.discounts;
            if (!discounts) {
                return null;
            }

            var price = new Price();
            discounts.each(function (discount) {
                if (discount.$.price && ["scale", "voucherShipping"].indexOf(discount.$.type) == -1) {
                    price.add(discount.$.price);
                }
            });

            if (price.$.vatIncluded > 0) {
                return price;
            } else {
                return null;
            }
        }.onChange("discounts"),

        getShippingDiscountPrice: function () {
            var voucherShipping = this.getDiscount('voucherShipping');
            return voucherShipping ? voucherShipping.get('price') : null;
        }.onChange('discounts'),

        hasCoupon: function () {
            var discounts = this.$.discounts;
            if (!discounts) {
                return false;
            }

            return !!discounts.find(function (discount) {
                return /^coupon|^voucher/.test(discount.$.type)
            });
        }.onChange("discounts")

    });
});
