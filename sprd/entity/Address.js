define(["js/data/Entity", "sprd/entity/ShippingState", "sprd/entity/Country", "sprd/entity/Person", "js/data/validator/RegExValidator"], function (Entity, ShippingState, Country, Person, RegExValidator) {

    var ADDRESS_TYPES = {
        PACKSTATION: "PACKSTATION",
        PRIVATE: "PRIVATE"
    };

    var Address = Entity.inherit("sprd.entity.Address", {

        defaults: {
            type: ADDRESS_TYPES.PRIVATE,
            company: null,
            person: Person,

            street: null,
            streetAnnex: null,
            houseNumber: '1',
            city: null,
            state: null,
            country: null,
            zipCode: null,
            email: null,
            phone: null,
            fax: null,

            root: null,
            shippingCountries: "{root.shippingCountries()}"
        },

        schema: {
            type: {
                type: String,
                required: true
            },
            company: {
                type: String,
                required: false
            },

            person: Person,

            street: String,

            streetAnnex: {
                type: String,
                required: false
            },
            city: String,
            houseNumber: String,
            state: {
                type: ShippingState,
                required: function () {
                    return this.get("country.code") === "US";
                }
            },
            country: {type: Country, isReference: true},
            zipCode: String,

            phone: {
                type: String,
                required: false
            },
            fax: {
                type: String,
                required: false
            }
        },

        validators: [
            new RegExValidator({
                field: "zipCode",
                regEx: /^[0-9]{0,10}$/,
                errorCode: 'zipCodeError'
            }),
            new RegExValidator({
                field: "city",
                regEx: /^[0-9a-zA-Z]{0,30}$/,
                errorCode: 'cityError'
            }),
            new RegExValidator({
                field: "street",
                regEx: /^[0-9a-zA-Z]{0,50}$/,
                errorCode: 'streetError'
            }),
            new RegExValidator({
                field: "streetAnnex",
                regEx: /^[0-9a-zA-Z]{0,50}$/,
                errorCode: 'streetAnnexError'
            })
        ],

        compose: function () {
            var data = this.callBase();

            if (this.get("country.code") !== "US") {
                delete data.state;
            }

            if (this.get('type') === ADDRESS_TYPES.PACKSTATION) {
                data.street = "Packstation " + data.street;
            }

            return data;
        },

        isPackStation: function () {
            return this.$.type == ADDRESS_TYPES.PACKSTATION;
        }.onChange('type')
    });

    Address.ADDRESS_TYPES = ADDRESS_TYPES;

    return Address;
});
