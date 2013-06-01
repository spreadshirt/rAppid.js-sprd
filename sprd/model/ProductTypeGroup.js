define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.ProductTypeGroup", {
        defaults: {
            name: "",
            description: ""
        }
    });
});
