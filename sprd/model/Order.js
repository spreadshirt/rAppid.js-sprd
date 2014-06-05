define(["sprd/data/SprdModel", "js/data/Entity", "sprd/entity/Address", "sprd/model/ShippingType", "checkout/bindable/Root"], function (SprdModel, Entity, Address, ShippingType, Root) {

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

        _commitShippingTypes: function(shippingTypes) {

            if (shippingTypes) {
                var shippingType = this.$.shippingType;
                if (!shippingType || _.indexOf(shippingTypes, shippingType) === -1) {
                    // select first shipping type or shipping type not available any more
                    this.set("shippingType", shippingTypes[0]);
                }
            }
        }
    });

    return SprdModel.inherit('sprd.model.Order', {

        inject: {
            root: Root
        },

        defaults: {
            root: null,
            basket: null,

            billing: Billing,
            shipping: Shipping,
            invoiceToShippingAddress: true,

            shippingCosts: "{shippingCosts()}",

            payment: null
        },

        schema: {
            billing: Billing,
            shipping: Shipping
        },

        ctor: function() {
            this.callBase();

            this.$.billing.set("order", this);
            this.$.shipping.set("order", this);
        },

        _postConstruct: function() {
            this.$.billing.$.address.set("root", this.$.root);
            this.$.shipping.$.address.set("root", this.$.root);
        },

        _commitShipToBillingAddress: function(shipToBillingAddress) {
            var address;
            if (shipToBillingAddress) {
                address = this.get("billing.address");
                if (address && !address.$.country) {
                    // set same country for shipping address as the delivery address
                    address.set("country", this.get("shipping.address.country"));
                }
            } else {
                address = this.get("shipping.address");
                if (address && !address.$.country) {
                    // set same country for shipping address as the delivery address
                    address.set("country", this.get("billing.address.country"));
                }
            }
        },

        total: function() {

            var basketVatIncluded = this.get("basket.vatIncluded()") || 0,
                orderDiscount = 0,
                voucherDiscount = 0,
                shippingCosts = this.get("shippingCosts.vatIncluded") || 0;

            return basketVatIncluded + orderDiscount + voucherDiscount + shippingCosts;
        }.onChange("basket.vatIncluded()", "shippingCosts.vatIncluded"),

        invoiceAddress: function () {
            return this.$.invoiceToShippingAddress ? this.get("shipping.address") : this.get("billing.address");
        }.onChange("invoiceToShippingAddress"),

        shippingCosts: function() {
            // TODO: change on basket price change -> pass basket price as argument
            return this.get("shipping.shippingType.getShippingCountryById(shipping.address.country.id).shippingRegion.getShippingCostsForOrderValue(20).cost");
        }.onChange("shipping.shippingType", "shipping.address.country"),

        shippingTypes: function() {

            var root = this.$.root,
                shippingCountry = this.get("shipping.address.country");

            if (root) {
                return root.getShippingTypesForCountry(shippingCountry);
            }

            return null;

        }.onChange("root", "shipping.address.country")


    });


});