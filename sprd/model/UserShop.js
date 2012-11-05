define(["sprd/data/SprdModel"], function (SprdModel) {
        return SprdModel.inherit("sprd.model.UserShop", {

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

