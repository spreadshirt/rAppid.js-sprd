define(["js/data/Entity"], function(Entity) {
    return Entity.inherit("checkout.entity.Payment", {
        type: "payment",

        defaults: {
            root: null,
            paymentTypeGroup: null
        },

        getType: function() {
            return this.type;
        },

        /***
         * determinate the real payment method. This is a hook so the credit card
         * payment type group can select the payment method
         *
         * @returns {*}
         */
        getPaymentType: function () {
            // return first paymentType
            return this.$.paymentTypeGroup.$.paymentTypes.at(0);
        }
    });
});