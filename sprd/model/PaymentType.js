define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.PaymentType", {

        defaults: {

        },

        schema: {
            weight: Number,
            type: String,
            subType: String,
            grossLowerLimit: Number,
            grossUpperLimit: Number
        }

    });
});