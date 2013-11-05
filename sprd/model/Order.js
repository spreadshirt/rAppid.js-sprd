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
            shipToBillingAddress: true,

            shippingCosts: "{shippingCosts()}"
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

        deliveryAddress: function() {
            return this.$.shipToBillingAddress ? this.get("billing.address") : this.get("shipping.address");
        }.onChange("shipToBillingAddress"),

        shippingCosts: function() {
            // TODO: change on basket price change -> pass basket price as argument
            return this.get("shipping.shippingType.getShippingCountryById(deliveryAddress().country.id).shippingRegion.getShippingCostsForOrderValue(20).cost");
        }.onChange("shipping.shippingType", "deliveryAddress().country"),

        shippingTypes: function() {

            var root = this.$.root,
                shippingCountry = this.get("deliveryAddress().country");

            if (root) {
                return root.getShippingTypesForCountry(shippingCountry);
            }

            return null;

        }.onChange("root", "deliveryAddress().country")


    });


});