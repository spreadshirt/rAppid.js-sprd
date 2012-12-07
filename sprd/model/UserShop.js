define(["sprd/model/AbstractShop"], function (Shop) {
    return Shop.inherit("sprd.model.UserShop", {
        defaults: {
            count: 0
        },
        schema: {
            name: String,
            description: String,
            type: String
        }
    });
});

