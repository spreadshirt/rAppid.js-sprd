define(["sprd/data/SprdModel", "sprd/entity/Size", "sprd/entity/PrintTypeColor"], function (SprdModel, Size, PrintTypeColor) {
    return SprdModel.inherit("sprd.model.PrintType", {

        defaults: {
            dpi: null
        },

        schema: {
            dpi: String,
            size: Size,
            colors: [PrintTypeColor]
        }
    })
});
