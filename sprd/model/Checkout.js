define(["sprd/data/SprdModel", "sprd/entity/Payment"], function(SprdModel, PaymentMethod, Payment) {


    return SprdModel.inherit("sprd.model.Checkout", {

        defaults: {
            paymentMethod: null,
            payment: null,
            links: null
        },

        $isDependentObject: true,

        schema: {
            paymentMethod: PaymentMethod,
            payment: Payment,
            links: Object
        }

    });

});