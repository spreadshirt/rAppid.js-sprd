define(["sprd/data/SprdCollection", "sprd/data/SprdModel", "sprd/model/BasketItem"], function (SprdCollection, SprdModel, BasketItem) {
    return SprdCollection.inherit("sprd.model.Basket",{
        addConcreteArticle: function(concreteArticle, quantity){
            var basketItem = this.getBasketItemForConcreteArticle(concreteArticle);
            if(basketItem){
                basketItem.increaseQuantity(quantity);
            }else{
                basketItem = new BasketItem({concreteArticle: concreteArticle});
                basketItem.bind('change:quantity', this._onItemQuantityChange, this);
                concreteArticle.bind('change:size', this._onArticleSizeChange, this);
                this.add(basketItem);
            }
        },
        _onItemQuantityChange: function(e,model){
            if(model.$.quantity === 0){
                this.remove(model);
            }
        },
        _onArticleSizeChange: function(e,model){
            var old, nItem;
            this.each(function(item){
               if(!nItem && item.$.concreteArticle !== model && item.$.concreteArticle.isEqual(model)){
                   nItem = item;
               }
            });
            if(nItem){
                this.each(function (item) {
                    if (item.$.concreteArticle === model) {
                        old = item;
                    }
                });
                nItem.increaseQuantity(old.$.quantity);
                this.remove(old);
            }

        },
        getBasketItemForConcreteArticle : function(concreteAricle){
            for (var i = 0; i < this.$items.length; i++) {
                var basketItem = this.$items[i];
                if(basketItem.$.concreteArticle.isEqual(concreteAricle)){
                    return basketItem;
                }
            }
            return null;
        },
        totalItemsCount: function () {
            var total = 0;
            this.each(function(item){
                total += item.$.quantity;
            });
            return total;
        }.on('change', 'add', 'remove'),
        vatIncluded: function(){
            var total = 0;
            this.each(function(item){
                total += item.vatIncluded();
            });
            return total;
        }.on('change', 'add', 'remove'),
        vatExcluded: function () {
            var total = 0;
            this.each(function (item) {
                total += item.vatExcluded();
            });
            return total;
        }.on('change', 'add', 'remove')
    });
});
