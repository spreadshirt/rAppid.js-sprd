define(["js/data/Collection", "sprd/model/StockState"], function(Collection, StockState) {
    return Collection.inherit("sprd.collection.StockStates", {

        $modelFactory: StockState,

        isSizeAndAppearanceAvailable: function(size, appearance){

            if (!(size && appearance)) {
                return false;
            }

            return this.find(function(item){
                return item.$.size.$.id === size.$.id && item.$.appearance.$.id === appearance.$.id;
            }) || false;
        }
    });
});