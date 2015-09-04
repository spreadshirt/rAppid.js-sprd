define(["sprd/data/SprdModel", "js/data/Entity", "sprd/model/Delivery"], function(SprdModel, Entity, Delivery) {


    var NestedShipping = Delivery.Shipping.inherit("sprd.model.Delivery.Shipping",{
        schema: {
            type: Object
        }
    });


    var NestedDelivery = Delivery.inherit("sprd.model.Delivery", {
        $isDependentObject: true,

        schema: {
            shipping: NestedShipping
        }
    });


    var AmazonDeliveryResult = Entity.inherit("sprd.model.AmazonDelivery.AmazonDeliveryResult", {
        defaults: {
            email: null,
            delivery: null
        },

        schema: {
            delivery: NestedDelivery,
            email: String
        }

    });


    return SprdModel.inherit('sprd.model.AmazonDelivery', {

        defaults: {
            addressConsentToken: null,
            orderReferenceId: null
        },

        schema: {
            addressConsentToken: String,
            orderReferenceId: String
        },

        resultType: AmazonDeliveryResult
    });

});