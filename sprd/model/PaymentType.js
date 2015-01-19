define(["sprd/data/SprdModel", "js/data/Entity"], function (SprdModel, Entity) {
    return SprdModel.inherit("sprd.model.PaymentType", {

        defaults: {
        },

        schema: {
            weight: Number,
            methodCode: String,
            categoryCode: String,
            grossLowerLimit: Number,
            grossUpperLimit: Number,
            banks: [Entity]
        }

    });
});