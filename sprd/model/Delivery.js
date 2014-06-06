define(["sprd/data/SprdModel", "js/data/Entity", "sprd/entity/Address", "sprd/model/ShippingType", "underscore"], function(SprdModel, Entity, Address, ShippingType, _) {

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
            shippingType: null,

            order: null,
            shippingTypes: "{order.shippingTypes()}"
        },

        schema: {
            address: Address,
            shippingType: ShippingType
        },

        _commitShippingTypes: function (shippingTypes) {

            if (shippingTypes) {
                var shippingType = this.$.shippingType;
                if (!shippingType || _.indexOf(shippingTypes, shippingType) === -1) {
                    // select first shipping type or shipping type not available any more
                    this.set("shippingType", shippingTypes[0]);
                }
            }
        }
    });


    return SprdModel.inherit("checkout.model.Delivery", {

        defaults: {
            billing: Billing,
            shipping: Shipping,

            invoiceToShippingAddress: true
        },


        $isDependentObject: true,

        schema: {
            shipping: Shipping,
            billing: Billing,

            email: String,
            presentMessage: String
        },

        invoiceAddress: function () {
            return this.$.invoiceToShippingAddress ? this.get("shipping.address") : this.get("billing.address");
        }.onChange("invoiceToShippingAddress")

    });

});