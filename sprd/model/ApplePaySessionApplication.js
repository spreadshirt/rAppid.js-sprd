define(["js/data/Model", "js/data/Entity"], function (Model, Entity) {

    var ApplePaySession = Entity.inherit('sprd.model.ApplePaySessionApplication.ApplePaySession', {
        defaults: {
            displayName: null,
            domainName: null,
            epochTimestamp: null,
            expiresAt: null,
            merchantIdentifier: null,
            merchantSessionIdentifier: null,
            nonce: null,
            signature: null
        },

        schema: {
            displayName: String,
            domainName: String,
            epochTimestamp: String,
            expiresAt: String,
            merchantIdentifier: String,
            merchantSessionIdentifier: String,
            nonce: String,
            signature: String
        }
    });

    return Model.inherit('sprd.model.ApplePaySessionApplication', {
        defaults: {
            validationUrl: null
        },

        schema: {
            validationUrl: String
        },

        resultType: ApplePaySession
    })
});