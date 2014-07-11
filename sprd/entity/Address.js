define(["js/data/Entity", "sprd/entity/ShippingState", "sprd/entity/Country", "sprd/entity/Person", "js/data/validator/Validator", "underscore", "js/data/validator/RegExValidator"], function (Entity, ShippingState, Country, Person, Validator, _, RegExValidator) {

    var ADDRESS_TYPES = {
        PACKSTATION: "PACKSTATION",
        PRIVATE: "PRIVATE"
    };

    var MAX_LENGTH = {
        STREET: 50,
        ZIP_CODE: 10,
        CITY: 30,
        STREET_ANNEX: 50
    };

    var LengthValidator = Validator.inherit({
        defaults: {
            errorCode: 'maxLengthError',
            /**
             * The min length of the input
             *
             * @type number
             */
            minLength: 0,
            /**
             * The max length of the input
             * -1 is for unlimited
             *
             * @type number
             */
            maxLength: -1
        },
        _validate: function (entity, options) {
            var value = entity.get(this.$.field),
                schemaDefinition = entity.schema[this.$.field],
                required = schemaDefinition ? schemaDefinition.required : true;


            if (_.isString(value) && (required && value.length || !required)) {

                if (value.length < this.$.minLength || (this.$.maxLength > -1 && value.length > this.$.maxLength)) {
                    return this._createFieldError();
                }
            }
        }
    });

    var POSTNUMMER = "Postnummer ",
        PACKSTATION = "Packstation ";

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
            packStationNr: "",
            postNr: "",

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

            street: {
                type: String,
                required: function () {
                    return this.get('type') == ADDRESS_TYPES.PRIVATE;
                }
            },

            streetAnnex: {
                type: String,
                required: false
            },
            city: String,
            houseNumber: String,
            state: {
                type: ShippingState,
                required: function () {
                    return this.isStateRequired();
                }
            },
            country: {
                type: Country,
                isReference: true
            },
            zipCode: {
                type: String,
                required: function () {
                    // not required for Ireland
                    return this.get('country.code') !== "IE";
                }
            },
            postNr: {
                type: String,
                required: function () {
                    return this.get('type') == ADDRESS_TYPES.PACKSTATION
                }
            },

            packStationNr: {
                type: String,
                required: function () {
                    return this.get('type') == ADDRESS_TYPES.PACKSTATION
                }
            },

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
            new LengthValidator({
                field: "zipCode",
                maxLength: MAX_LENGTH.ZIP_CODE
            }),
            new LengthValidator({
                field: "city",
                maxLength: MAX_LENGTH.CITY
            }),
            new LengthValidator({
                field: "street",
                maxLength: MAX_LENGTH.STREET
            }),
            new LengthValidator({
                field: "streetAnnex",
                maxLength: MAX_LENGTH.STREET_ANNEX
            }),
            new RegExValidator({
                field: "street",
                regEx: /postfiliale/i,
                inverse: true,
                errorCode: "postfilialeNotSupported"
            })
        ],

        _commitChangedAttributes: function ($) {
            this.callBase();

            if ($.hasOwnProperty("country") && this.$.type === ADDRESS_TYPES.PACKSTATION) {
                if ($.country.get('code') != "DE") {
                    this.set('type', ADDRESS_TYPES.PRIVATE);
                }
            }
        },

        parse: function (data) {
            if (data.type === ADDRESS_TYPES.PACKSTATION) {
                data.packStationNr = data.street ? data.street.replace(PACKSTATION, "") : "";
                data.postNr = data.streetAnnex ? data.streetAnnex.replace(POSTNUMMER, "") : "";
                delete data.streetAnnex;
                delete data.street;
            }

            return this.callBase(data);
        },

        compose: function () {
            var data = this.callBase();

            if (this.get("country.code") !== "US") {
                delete data.state;
            }

            if (this.get('type') === ADDRESS_TYPES.PACKSTATION) {
                data.street = PACKSTATION + data.packStationNr;
                data.streetAnnex = POSTNUMMER + data.postNr;
            } else {
                delete data.packstationNr;
                delete data.postNr;
            }

            return data;
        },

        isPackStation: function () {
            return this.$.type == ADDRESS_TYPES.PACKSTATION;
        }.onChange('type'),

        supportsCounty: function () {
            var code = this.get('country.code');
            return  code === "GB" || code === "IE";
        }.onChange('country'),

        isStateRequired: function () {
            var code = this.get("country.code");
            return  code === "US" || code === "IE";
        }.onChange('country')
    });

    Address.ADDRESS_TYPES = ADDRESS_TYPES;
    Address.MAX_LENGTH = MAX_LENGTH;

    return Address;
});
