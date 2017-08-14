define(["js/data/Model"], function(Model) {

    return Model.inherit("sprd.model.MaskApplier", {
        schema: {
            designId: String,
            targetShopId: String,
            transformX: String,
            transformY: String,
            maskWidth: String,
            maskHeight: String
        }
    })
});