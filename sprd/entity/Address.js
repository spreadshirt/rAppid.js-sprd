define(["js/data/Entity", "sprd/entity/ShippingState", "sprd/entity/Country", "sprd/entity/Person", "sprd/data/validator/LengthValidator", "js/data/validator/RegExValidator", "js/data/transformer/TrimTransformer"], function (Entity, ShippingState, Country, Person, LengthValidator, RegExValidator, TrimTransformer) {

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
                required: function () {
                    return this.isCompany();
                }
            },

            person: Person,

            street: {
                type: String,
                required: function () {
                    return !this.isPackStation();
                }
            },

            streetAnnex: {
                type: String,
                required: false
            },
            city: String,
            houseNumber: String,
            state: {
                isReference: true,
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
                    return this.needsZipCode();
                }
            },
            postNr: {
                type: String,
                required: function () {
                    return this.isPackStation()
                }
            },

            packStationNr: {
                type: String,
                required: function () {
                    return this.isPackStation()
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

        transformers: [
            new TrimTransformer()
        ],

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
            }),
            new RegExValidator({
                field: "street",
                regEx: /packstation|postnummer/i,
                inverse: true,
                errorCode: "packstationError"
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

            if (!this.isStateRequired()) {
                delete data.state;
            }

            if (!this.needsZipCode() && !data.zipCode) {
                data.zipCode = "-";
            }

            if (this.get('type') === ADDRESS_TYPES.PACKSTATION) {
                data.street = PACKSTATION + (data.packStationNr || "").replace(/packstation/i, " ").replace(/^\s*|\s*$/, "");
                data.streetAnnex = POSTNUMMER + data.postNr;
            } else {
                delete data.packStationNr;
                delete data.postNr;
            }

            return data;
        },

        isPackStation: function () {
            return this.$.type == ADDRESS_TYPES.PACKSTATION;
        }.onChange('type'),

        needsCounty: function () {
            return  this.get('country.code') === "IE";
        }.onChange('country'),

        isStateRequired: function () {
            return  this.get("country.code") === "US";
        }.onChange('country'),

        needsZipCode: function () {
            // not required for ireland
            return this.get("country.code") !== "IE";
        }.onChange('country'),

        isCompany: function () {
            return this.get('person.salutation') == "4"
        }.onChange('person.salutation')
    });

    Address.ADDRESS_TYPES = ADDRESS_TYPES;
    Address.MAX_LENGTH = MAX_LENGTH;

    return Address;
});
