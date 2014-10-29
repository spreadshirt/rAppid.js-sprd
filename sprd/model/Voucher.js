define(["sprd/data/SprdModel"], function (SprdModel) {

    return SprdModel.inherit("sprd.model.Voucher", {

        defaults: {
            voucherCode: null
        },

        $isDependentObject: true,

        schema: {
            voucherCode: String
        }
    });

});