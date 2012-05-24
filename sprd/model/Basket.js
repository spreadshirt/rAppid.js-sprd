define(["sprd/data/SprdModel", "sprd/model/BasketItem", "js/data/Collection"], function (SprdModel, BasketItem, Collection) {
    return SprdModel.inherit("sprd.model.Basket", {

        $schema: {
            basketItems: Collection.of(BasketItem)
        },

        defaults: {
            basketItems: Collection.of(BasketItem)
        },

        $cacheInRootContext: true,

        getContextForChildren: function (childFactory) {
            return this.$context.$datasource.getContext({
                basketId: this.$.id
            });
        },

        addElement: function (element, quantity) {
            quantity = quantity || 1;

            var basketItem = this.getBasketItemForElement(element);
            if (basketItem) {
                basketItem.increaseQuantity(quantity);
            } else {
                basketItem =  new BasketItem({element: element});
                basketItem.bind('change:quantity', this._onItemQuantityChange, this);
                element.bind('change:size', this._onArticleSizeChange, this);
                this.$.basketItems.add(basketItem);
            }

            return basketItem;
        },

        _onItemQuantityChange: function (e, model) {
            if (model.$.quantity < 1) {
                this.$.basketItems.remove(model);
            }
        },

        _onArticleSizeChange: function (e, model) {
            var old, nItem;
            this.$.basketItems.each(function (item) {
                if (!nItem && item.$.element !== model && item.$.element.isEqual(model)) {
                    nItem = item;
                }
            });
            if (nItem) {
                this.$.basketItems.each(function (item) {
                    if (!old && item.$.element === model) {
                        old = item;
                    }
                });
                nItem.increaseQuantity(old.$.quantity);
                this.$.basketItems.remove(old);
            }

        },

        getBasketItemForElement: function (element) {
            for (var i = 0; i < this.$.basketItems.$items.length; i++) {
                var basketItem = this.$.basketItems.$items[i];
                if (basketItem.$.element.isEqual(element)) {
                    return basketItem;
                }
            }
            return null;
        },

        _bindList: function (newList, oldList) {
            if (oldList) {
                oldList.unbind('change', this._triggerFunctions, this);
                oldList.unbind('add', this._triggerFunctions, this);
                oldList.unbind('remove', this._triggerFunctions, this);
            }

            if (newList) {
                newList.bind('change', this._triggerFunctions, this);
                newList.bind('add', this._triggerFunctions, this);
                newList.bind('remove', this._triggerFunctions, this);
            }
        },

        _triggerFunctions: function () {
            this.trigger('change', {});
        },

        _commitChangedAttributes: function (attributes) {
            this.callBase();

            if (attributes.basketItems) {
                this._bindList(attributes.basketItems, this.$previousAttributes['basketItems']);
            }
        },

        totalItemsCount: function () {
            var total = 0;
            this.$.basketItems.each(function (item) {
                total += item.$.quantity;
            });
            return total;
        }.on('change'),

        vatIncluded: function () {
            var total = 0;
            this.$.basketItems.each(function (item) {
                total += item.vatIncluded();
            });
            return total;
        }.on('change'),

        vatExcluded: function () {
            var total = 0;
            this.$.basketItems.each(function (item) {
                total += item.vatExcluded();
            });
            return total;
        }.on('change')
    });
});
