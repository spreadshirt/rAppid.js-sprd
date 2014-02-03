define(["js/data/Collection", "sprd/model/StockState"], function(Collection, StockState) {
    return Collection.inherit("sprd.collection.StockStates", {

        $modelFactory: StockState,

        isSizeAndAppearanceAvailable: function(size, appearance){

            if (!(size && appearance)) {
                return false;
            }

            var stockState = this.find(function (item) {
                return item.$.size.$.id === size.$.id && item.$.appearance.$.id === appearance.$.id;
            });

            if (stockState) {
                return stockState.$.available;
            }

            return false;
        }
    });
});