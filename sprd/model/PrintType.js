define(["sprd/data/SprdModel", "sprd/entity/Size", "sprd/entity/Color"], function (SprdModel, Size, Color) {
    return SprdModel.inherit("sprd.model.PrintType", {

        defaults: {
            dpi: null
        },

        schema: {
            dpi: String,
            size: Size,
            colors: [Color]
        }
    })
});
