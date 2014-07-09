define(["sprd/data/SprdModel",
    "js/data/Entity",
    "sprd/model/Session",
    "sprd/model/User",
    "sprd/model/Language", "sprd/model/Country"], function (SprdModel, Entity, Session, User, Language, Country) {

    var PARTNER_TYPE = {
        "NONE": "NONE",
        "STANDARD": "STANDARD",
        "PREMIUM": "PREMIUM",
        "SPREAD": "SPREAD"
    };

    var RegistrationResult = Entity.inherit('sprd.model.Registration.RegistrationResult', {
        schema: {
            session: {
                type: Session,
                required: false
            },
            user: {
                type: User,
                required: false
            }
        }
    });


    var Registration = SprdModel.inherit('sprd.model.Registration', {
        defaults: {
            email: "",
            password: "",
            guest: false,
            partnerType: PARTNER_TYPE.NONE
        },
        schema: {
            email: String,
            password: {
                type: String,
                required: false
            },
            username: {
                type: String,
                required: false
            },
            realname: {
                type: String,
                required: false
            },
            partnerType: String,
            guest: Boolean,
            country: Country,
            language: Language
        },
        resultType: RegistrationResult
    });

    Registration.PARTNER_TYPE = PARTNER_TYPE;
    Registration.RegistrationResult = RegistrationResult;

    return Registration;
});