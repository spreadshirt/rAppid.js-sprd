define(["sprd/data/SprdModel", "js/data/Entity", "sprd/entity/Address", "sprd/model/ShippingType", "underscore", "js/data/validator/EmailValidator"], function (SprdModel, Entity, Address, ShippingType, _, EmailValidator) {

    var Billing = Entity.inherit("sprd.model.Order.Billing", {
        defaults: {
            address: Address
        },

        schema: {
            address: Address
        }

    });


    var Shipping = Entity.inherit("sprd.model.Order.Shipping", {
        defaults: {
            address: Address,
            type: null
        },

        schema: {
            address: Address,
            type: ShippingType
        }
    });


    return SprdModel.inherit("sprd.model.Delivery", {

        defaults: {
            billing: Billing,
            shipping: Shipping,

            email: null,
            phone: null,

            giftWrappingMessage: null,
            useGiftWrapping: false,

            invoiceToShippingAddress: true
        },

        $isDependentObject: true,

        schema: {
            shipping: Shipping,
            billing: Billing,

            email: String,

            giftWrappingMessage: {
                required: false,
                type: String
            },

            phone: {
                required: function() {
                    // required if shipping type is express
                    return this.get("shipping.type.isExpress");
                },
                type: String
            },

            useGiftWrapping: Boolean
        },

        validators: [
            new EmailValidator({field: "email"})
        ],

        // TODO: add phone validator, checking DEV-68278 + shipping type determinates if optional or not

        compose: function () {
            var data = this.callBase();

            if (this.$.invoiceToShippingAddress) {
                delete data.billing;
            }

            if (!this.$.phone) {
                data.phone = null;
            }

            return data;
        },

        parse: function (data) {
            var billingAddress = this.get(data, 'billing.address'),
                shippingAddress = this.get(data, 'shipping.address');

            if (billingAddress) {
                billingAddress.set('id', billingAddress.$.id || "billing");
            }
            if (shippingAddress) {
                shippingAddress.set('id', shippingAddress.$.id || "shipping");
            }
            if (billingAddress && shippingAddress) {
                this.set('invoiceToShippingAddress', shippingAddress.$.id == billingAddress.$.id);
            }
            return this.callBase();
        },

        invoiceAddress: function () {
            return this.$.invoiceToShippingAddress ? this.get("shipping.address") : this.get("billing.address");
        }.onChange("invoiceToShippingAddress", "billing.address", "shipping.address")

    });

});