define(["sprd/data/SprdModel", "js/data/Entity", "sprd/model/Delivery"], function(SprdModel, Entity, Delivery) {

    var AmazonDeliveryResult = Entity.inherit("sprd.model.AmazonDelivery.AmazonDeliveryResult", {
        defaults: {
            email: null,
            delivery: null
        },

        schema: {
            delivery: Delivery,
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