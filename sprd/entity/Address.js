define(["js/data/Entity", "sprd/entity/ShippingState", "sprd/entity/Country", "sprd/entity/Person", "sprd/data/validator/LengthValidator", "js/data/validator/RegExValidator", "js/data/transformer/TrimTransformer", "js/data/validator/Validator", "underscore"], function (Entity, ShippingState, Country, Person, LengthValidator, RegExValidator, TrimTransformer, Validator, _) {

    var ADDRESS_TYPES = {
        PACKSTATION: "PACKSTATION",
        PRIVATE: "PRIVATE",
        UPS_PICKUP: "UPS_PICKUP"
    };

    var MAX_LENGTH = {
        STREET: 50,
        ZIP_CODE: 10,
        CITY: 30,
        STREET_ANNEX: 50
    };

    var MIN_LENGTH = {
        STREET: 3
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

    var StreetValidator = Validator.inherit({

        _validate: function (entity) {
            var value = entity.get(this.$.field);

            // if its HQ don't validate
            if (value && !/^HQ/.test(value)) {
                // validate minlength, maxlength and that it contains a number
                if (value.length < MIN_LENGTH.STREET || value.length > MAX_LENGTH.STREET ||
                    (!/\d/.test(value) && _.indexOf(["GB", "FR", "IE", "GG", "ES"], entity.get("country.code")) === -1)
                ) {
                    return this._createFieldError(this.$.field);
                }
            }
        }

    });

    var PackStationValidation = RegExValidator.inherit({
        _validate: function(entity, option) {
            option = option || {};

            if ((option.validationOptions || {}).skipPackStationValidation === true) {
                return;
            }

            return this.callBase();

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

            person: {
                type: Person
            },

            street: {
                type: String,
                required: function () {
                    return this.isPrivate();
                }
            },
            streetAnnex: {
                type: String,
                required: false
            },
            city: {
                type: String,
                required: function() {
                    return this.isPrivate();
                }
            },
            houseNumber: {
                type: String,
                required: false
            },
            state: {
                isReference: true,
                type: ShippingState,
                required: function () {
                    return this.isPrivate() && this.isStateRequired();
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
                    return this.isPrivate() && this.needsZipCode();
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

            ups: {
                type: Object,
                required: function() {
                    return this.isUpsPickup()
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

        ctor: function() {
            this.callBase();
            this.$.person.$address = this;
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
                field: "streetAnnex",
                maxLength: MAX_LENGTH.STREET_ANNEX
            }),
            new RegExValidator({
                field: "street",
                regEx: /postfiliale/i,
                inverse: true,
                errorCode: "postfilialeNotSupported"
            }),
            new PackStationValidation({
                field: "street",
                regEx: /packstation|postnummer/i,
                inverse: true,
                errorCode: "packstationError"
            }),
            new StreetValidator({
                field: "street",
                errorCode: "wrongFormat"
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

                if ($.country && $.country.$.code === "AU" && this.get("person.salutation") == 4) {
                    // company to australia is forbidden, see DEV-134352
                    this.$.person.set("salutation", null);
                }
            }
        },

        _commitVatId: function (vatId) {
            if (vatId && this.fieldError("vatId")) {
                this.$errors.unset('vatId');
            }
        },

        _commitCountry: function (country) {
            if (country && this.fieldError("vatId")) {
                this.$errors.unset("vatId");
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
            } else if (data.type === ADDRESS_TYPES.UPS_PICKUP) {
                delete data.street;
                delete data.streetAnnex;
                delete data.company;
                delete data.zipCode;
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

            var type = this.get('type');

            if (!this.isCompany()) {
                delete data.company;
                delete data.vatId;
            } else if (data.vatId && !/^[A-Z]{2}/.test(data.vatId)) {
                data.vatId = (this.get("country.code") || "").toUpperCase() + data.vatId.replace(/^[A-Z]*/, "");
            }

            if (type === ADDRESS_TYPES.PACKSTATION) {
                data.street = PACKSTATION + (data.packStationNr || "").replace(/packstation/i, " ").replace(/^\s*|\s*$/, "");
                data.streetAnnex = POSTNUMMER + data.postNr;
            } else if (type === ADDRESS_TYPES.UPS_PICKUP) {
                var ups = data.ups;
                data.street = ups.street;
                data.streetAnnex = ups.streetAnnex;
                data.company = ups.company;
                data.city = ups.city;
                data.zipCode = ups.zipCode;
            }


            delete data.packStationNr;
            delete data.postNr;
            delete data.ups;



            // send empty house number
            data.houseNumber = "";

            return data;
        },

        needsVatId: function (platform) {
            return platform == "EU" && this.isCompany() && (this.$.isBillingAddress || this.$.isSameAsBillingAddress);
        }.onChange('personSalutation', 'isBillingAddress', 'isSameAsBillingAddress'),

        isPrivate: function() {
            return this.$.type == ADDRESS_TYPES.PRIVATE;
        }.onChange('type'),

        isPackStation: function () {
            return this.$.type == ADDRESS_TYPES.PACKSTATION;
        }.onChange('type'),

        isUpsPickup: function() {
            return this.$.type == ADDRESS_TYPES.UPS_PICKUP;
        }.onChange('type'),

        supportsPackStation: function () {
            return this.$.personSalutation !== Person.Salutation.COMPANY && this.get('country.code') === "DE" && !this.$.isBillingAddress;
        }.onChange('country.code', 'personSalutation', 'isBillingAddress'),

        supportsUpsPickup: function() {
            return this.$.personSalutation !== Person.Salutation.COMPANY && this.get('country.code') === "FR" && !this.$.isBillingAddress;
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
