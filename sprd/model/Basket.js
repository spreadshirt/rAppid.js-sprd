define(["sprd/data/SprdModel", "sprd/model/BasketItem", "js/data/Collection", "sprd/model/Currency"], function (SprdModel, BasketItem, Collection, Currency) {
    return SprdModel.inherit("sprd.model.Basket", {

        schema: {
            basketItems: Collection.of(BasketItem),
            shop: "sprd/model/Shop",
            currency: Currency
        },

        ctor: function(){
            this.callBase();

            this.bind('basketItems','change', this._triggerFunctions, this);
            this.bind('basketItems','add', this._triggerFunctions, this);
            this.bind('basketItems','remove', this._triggerFunctions, this);
        },

        addElement: function (element, quantity) {
            quantity = quantity || 1;

            var basketItem = this.getBasketItemForElement(element);
            if (basketItem) {
                basketItem.increaseQuantity(quantity);
            } else {
                basketItem =  this.$.basketItems.createItem();
                basketItem.set({
                    element: element,
                    quantity: quantity
                });
                this.$.basketItems.add(basketItem);
            }

            return basketItem;
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
            if(this.$.basketItems){
                this.$.basketItems.each(function (item) {
                    total += item.$.quantity;
                });
            }
            return total;
        }.on('change'),

        vatIncluded: function () {
            var total = 0;
            if(this.$.basketItems){
                this.$.basketItems.each(function (item) {
                    total += item.totalVatIncluded();
                });
            }
            return total;
        }.on('change'),

        vatExcluded: function () {
            var total = 0;
            if(this.$.basketItems){
                this.$.basketItems.each(function (item) {
                    total += item.totalVatExcluded();
                });
            }
            return total;
        }.on('change'),

        platformCheckoutLink: function(){
            if(this.$.links){
                return this.$.links[2].href;
            }
            return null;
        }.onChange('links'),

        shopCheckoutLink: function(){
            if (this.$.links) {
                return this.$.links[1].href;
            }
            return null;
        }.onChange('links')
    });
});
