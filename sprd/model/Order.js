define(["sprd/data/SprdModel", "js/data/Entity", "sprd/entity/Address"], function (SprdModel, Entity, Address) {

    var Billing = Entity.inherit("sprd.model.Order.Billing", {
        defaults: {
            address: Address
        },

        schema: {
            address: Address
        }

    });

    return SprdModel.inherit('sprd.model.Order', {
        defaults: {
            billing: Billing
        },

        schema: {
            billing: Billing
        }

    });


});