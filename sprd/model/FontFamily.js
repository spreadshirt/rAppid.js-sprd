define(["sprd/data/SprdModel", "js/data/Collection", "sprd/model/PrintType", "sprd/entity/Font"], function (SprdModel, Collection, PrintType, Font) {
    return SprdModel.inherit("sprd.model.FontFamily", {

        schema: {
            printTypes: Collection.of(PrintType),
            fonts: [Font],
            deprecated: Boolean
        }

    })
});
