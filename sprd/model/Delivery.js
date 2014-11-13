define(["sprd/data/SprdModel", "js/data/Entity", "sprd/entity/Address", "sprd/model/ShippingType", "underscore", "js/data/validator/EmailValidator", "js/data/validator/RegExValidator", "js/data/transformer/TrimTransformer", "sprd/data/validator/LengthValidator"], function (SprdModel, Entity, Address, ShippingType, _, EmailValidator, RegExValidator, TrimTransformer, LengthValidator) {

    var Billing = Entity.inherit("sprd.model.Order.Billing", {
        defaults: {
            address: Address
        },

        schema: {
            address: Address
        },
        _commitAddress: function (address) {
            if (address) {
                address.set('isBillingAddress', true);
            }
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
        },
        _commitAddress: function (address) {
            if (address) {
                address.set('isBillingAddress', false);
            }
        }
    });


    var Delivery = SprdModel.inherit("sprd.model.Delivery", {

        defaults: {
            billing: Billing,
            shipping: Shipping,

            email: null,
            phone: null,

            giftWrappingMessage: null,
            useGiftWrapping: false,

            invoiceToShippingAddress: true,
            shippingVatId: "{shipping.address.vatId}"
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
                required: function () {
                    // required if shipping type has phone number required
                    return this.get("shipping.type.phoneNumberRequired");
                },
                type: String
            },

            useGiftWrapping: Boolean
        },

        reset: function () {
            this.set({
                email: null,
                phone: null,
                giftWrappingMessage: null,
                useGiftWrapping: false,
                invoiceToShippingAddress: true,
                billing: new Billing()
            });
        },

        transformers: [
            new TrimTransformer()
        ],

        validators: [
            new EmailValidator({field: "email"}),
            new RegExValidator({
                field: "phone",
                errorCode: "atLeast8Digits",
                regEx: /(.*\d.*){8}/
            }),
            new RegExValidator({
                field: "email",
                errorCode: 'emailError',
                regEx: /^[^@]+@.{1,64}\.[^.]+$/
            }),
            new LengthValidator({
                field: "email",
                errorCode: 'emailError',
                maxLength: 255
            }),
            new LengthValidator({
                field: "phone",
                maxLength: 30
            })
        ],

        // TODO: add phone validator, checking DEV-68278 + shipping type determinates if optional or not

        _commitInvoiceToShippingAddress: function (invoiceToShippingAddress) {
            var address = this.get('shipping.address');
            if (address) {
                address.set('isSameAsBillingAddress', invoiceToShippingAddress);
            }
        },

        _commitShippingVatId: function (vatId) {
            var address = this.get('billing.address');
            if (address) {
                address.set('vatId', vatId);
            }
        },

        compose: function () {
            var data = this.callBase();

            if (this.$.invoiceToShippingAddress) {
                delete data.billing;
            }

            if (!this.$.phone) {
                data.phone = null;
            }

            if (!this.$.useGiftWrapping) {
                delete data.giftWrappingMessage;
            }

            return data;
        },

        parse: function (data) {
            var billingAddress = this.get(data, 'billing.address'),
                shippingAddress = this.get(data, 'shipping.address');

            /**
             * we use the ids to determin if the billing address is the same as billing address
             * its a lil bit of a hack but faster than comparing all the fields.
             *
             * */
            if (billingAddress && shippingAddress) {
                var invoiceToShippingAddress = shippingAddress.$.id == billingAddress.$.id;
                this.set('invoiceToShippingAddress', invoiceToShippingAddress);
//                if(invoiceToShippingAddress && shippingAddress){
//                    shippingAddress.set('isBillingAddress', false);
//                }
            }

            if (this.$.invoiceToShippingAddress) {
                this.set('billing', new Billing());
                this.$.billing.$.address.set('id', "billing");
            } else if (billingAddress) {
                billingAddress.set({
                    'id': billingAddress.$.id || "billing",
                    'isBillingAddress': true
                });
            }

            if (shippingAddress) {
                shippingAddress.set({
                    'id': shippingAddress.$.id || "shipping",
                    'isBillingAddress': false
                });
            }
            return this.callBase();
        },

        invoiceAddress: function () {
            return this.$.invoiceToShippingAddress ? this.get("shipping.address") : this.get("billing.address");
        }.onChange("invoiceToShippingAddress", "billing.address", "shipping.address")

    });

    Delivery.Shipping = Shipping;
    Delivery.Billing = Billing;

    return Delivery;

});