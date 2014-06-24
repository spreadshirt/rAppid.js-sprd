define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.PaymentType", {

        defaults: {

        },

        schema: {
            weight: Number,
            methodCode: String,
            categoryCode: String,
            grossLowerLimit: Number,
            grossUpperLimit: Number
        }

    });
});