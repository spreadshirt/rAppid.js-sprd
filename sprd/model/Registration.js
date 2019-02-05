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

    var Newsletter = Entity.inherit('sprd.model.Registration.Newsletter', {
        defaults: {
            lists: {
                customer: true
            }
        },

        schema: {
            salutation: String,
            firstName: String,
            lastName: String,
            shop: String,
            lists: Object
        },

        setListType: function (type, enabled) {
            this.$.lists[type] = !!enabled;
        },

        compose: function () {
            var data = this.callBase();

            if (data.salutation) {
                data.salutation = {
                    id: data.salutation
                };
            } else {
                data.salutation = {
                    id: 0
                }
            }

            if (data.shop) {
                data.shop = {
                    id: data.shop
                };
            }

            return data;
        }
    });


    var Registration = SprdModel.inherit('sprd.model.Registration', {
        defaults: {
            email: "",
            password: null,
            guest: false,
            partnerType: PARTNER_TYPE.NONE,
            source: "CHECKOUT"
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
            language: Language,
            newsletter: {
                type: Newsletter,
                required: false
            },
            source: String
        },
        resultType: RegistrationResult
    });

    Registration.PARTNER_TYPE = PARTNER_TYPE;
    Registration.RegistrationResult = RegistrationResult;
    Registration.Newsletter = Newsletter;

    return Registration;
});