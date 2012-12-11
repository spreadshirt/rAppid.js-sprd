define(["sprd/data/SprdModel", "sprd/entity/Size"], function (SprdModel, Size) {
    return SprdModel.inherit("sprd.model.PrintType", {

        defaults: {
            dpi: null
        },

        schema: {
            dpi: String,
            size: Size
        }
    })
});
