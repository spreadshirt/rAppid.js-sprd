define(["sprd/entity/MessageContent", "js/data/validator/EmailValidator"], function(Entity, EmailValidator) {

    return Entity.inherit("sprd.entity.ShareProductMessageContent", {
        type: "sprd:shareProduct",

        defaults: {
            locale: "en_EU",
            message: "",
            shopId: null,
            productId: null,
            mailFrom: null,
            mailTo: null,
            viewIds: null,
            productDeeplinkURL: null
        },

        schema: {
            locale: String,

            message: {
                type: String,
                required: false
            },

            shopId: String,
            productId: String,

            mailFrom: String,
            mailTo: String,

            viewIds: String,
            productDeeplinkURL: String
        },

        validators: [
            new EmailValidator({
                field: "mailFrom"
            }),

            new EmailValidator({
                field: "mailTo"
            })
        ]

    });

});