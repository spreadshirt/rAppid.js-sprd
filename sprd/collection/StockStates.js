define(["js/data/Collection", "sprd/model/StockState"], function(Collection, StockState) {
    return Collection.inherit("sprd.collection.StockStates", {

        $modelFactory: StockState,

        isSizeAndAppearanceAvailable: function(size, appearance){
            return this.each(function(item){
                if(item.$.size.$.id === size.$.id && item.$.appearance.$.id === appearance.$.id){
                    this['return'](item.$.available);
                }
            }) || false;
        }
    });
});