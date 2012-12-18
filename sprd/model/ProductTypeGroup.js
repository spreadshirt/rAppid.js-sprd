define(["sprd/data/SprdModel", "sprd/entity/ProductTypeView", "js/data/Entity", "sprd/entity/Appearance","sprd/collection/StockStates", 'js/core/List', 'sprd/entity/ProductTypeSize', 'sprd/entity/PrintArea', 'sprd/type/Color', 'underscore'], function (SprdModel, ProductTypeView, Entity, Appearance, StockStates, List, Size, PrintArea, Color, _) {
    return SprdModel.inherit("sprd.model.ProductTypeGroup", {
        defaults: {
            name: "",
            description: ""
        }
    })
});
