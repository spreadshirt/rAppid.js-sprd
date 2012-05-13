define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.Product", {
        price: function () {
            // TODO format price with currency
            return this.$.price.vatIncluded;
        },
        getDefaultView: function(){
            if(this.$.defaultValues && this.$.productType) {
                return this.$.productType.getViewById(this.$.defaultValues.defaultView.id);
            }
            return null;
        }
    });
});
