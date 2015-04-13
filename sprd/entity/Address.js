define(["js/data/Entity", "sprd/entity/ShippingState", "sprd/entity/Country", "sprd/entity/Person", "sprd/data/validator/LengthValidator", "js/data/validator/RegExValidator", "js/data/transformer/TrimTransformer", "js/data/validator/Validator"], function (Entity, ShippingState, Country, Person, LengthValidator, RegExValidator, TrimTransformer, Validator) {

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

    var VatValidator = Validator.inherit({
        _validate: function (entity) {
            var error = entity.fieldError(this.$.field);
            if (error && error.$.code == this.$.errorCode) {
                // return true of the field is empty
                return !entity.get(this.$.field) ? null : this._createFieldError(this.$.field);
            }
            return null;
        }
    });

    var Address = Entity.inherit("sprd.entity.Address", {

        defaults: {
            type: ADDRESS_TYPES.PRIVATE,
            company: null,
            person: Person,
            isBillingAddress: false,
            street: null,
            streetAnnex: null,
            houseNumber: null,
            city: null,
            state: null,
            country: null,
            zipCode: null,
            email: null,
            phone: null,
            fax: null,
            packStationNr: "",
            postNr: "",
            personSalutation: "{person.salutation}",
            isSameAsBillingAddress: true,
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

            vatId: {
                type: String,
                required: false
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
            houseNumber: {
                type: String,
                required: false
            },
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
            }),
            new VatValidator({
                field: "vatId",
                errorCode: "vatIdError"
            })
        ],

        _commitChangedAttributes: function ($) {
            this.callBase();

            if ($.hasOwnProperty("country") && this.$.type === ADDRESS_TYPES.PACKSTATION) {
                if ($.country.get('code') != "DE") {
                    this.set('type', ADDRESS_TYPES.PRIVATE);
                }
            }
            if ($.hasOwnProperty("country")) {
                if (!this.isStateRequired()) {
                    this.set('state', null);
                }
            }
        },

        _commitVatId: function (vatId) {
            if (vatId && this.fieldError("vatId")) {
                this.$errors.unset('vatId');
            }
        },

        _commitPersonSalutation: function (salutation) {
            if (salutation === Person.Salutation.COMPANY) {
                this.set('type', ADDRESS_TYPES.PRIVATE);
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

            if(!this.isCompany()){
                delete data.company;
                delete data.vatId;
            } else if (data.vatId && !/^[A-Z]{2}/.test(data.vatId)) {
                data.vatId = (this.get("country.code") || "").toUpperCase() + data.vatId.replace(/^[A-Z]*/, "");
                console.dir(data);
            }

            return data;
        },

        needsVatId: function () {
            return this.isCompany() && (this.$.isBillingAddress || this.$.isSameAsBillingAddress);
        }.onChange('personSalutation', 'isBillingAddress', 'isSameAsBillingAddress'),

        isPackStation: function () {
            return this.$.type == ADDRESS_TYPES.PACKSTATION;
        }.onChange('type'),

        supportsPackStation: function () {
            return this.$.personSalutation !== Person.Salutation.COMPANY && this.get('country.code') === "DE" && !this.$.isBillingAddress;
        }.onChange('country.code', 'personSalutation', 'isBillingAddress'),

        needsCounty: function () {
            return  this.get('country.code') === "IE";
        }.onChange('country'),

        hasStates: function () {
            return this.get("country.shippingStates.length") > 0
        }.onChange("country"),

        isStateRequired: function () {
            return  ["US", "CA"].indexOf(this.get('country.code')) > -1;
        }.onChange('country'),

        needsZipCode: function () {
            // not required for ireland
            return this.get("country.code") !== "IE";
        }.onChange('country'),

        isCompany: function () {
            return this.$.personSalutation === Person.Salutation.COMPANY
        }.onChange('personSalutation'),

        isEqual: function (address) {
            if (!address) {
                return false;
            }
            var field,
                fields = ["type", "company", "vatId", "person.firstName", "person.lastName", "person.salutation", "street", "streetAnnex", "city", "state.code", "country.code", "zipCode", "postNr", "packStationNr", "phone", "fax"];

            for (var i = 0; i < fields.length; i++) {
                field = fields[i];
                var value = this.get(field),
                    compare = address.get(field);

                if (value && value.isEqual) {
                    if (!value.isEqual(compare)) {
                        return false;
                    }
                } else {
                    if (value !== compare) {
                        return false;
                    }
                }
            }
            return true;
        }
    });

    Address.ADDRESS_TYPES = ADDRESS_TYPES;
    Address.MAX_LENGTH = MAX_LENGTH;

    return Address;
});
