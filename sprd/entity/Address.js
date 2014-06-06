define(["js/data/Entity", "sprd/entity/ShippingState", "sprd/entity/ShippingCountry", "sprd/entity/Person"], function (Entity, ShippingState, ShippingCountry, Person) {

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
            houseNumber: null,
            streetAnnex: null,
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
            houseNumber: String,
            streetAnnex: {
                type: String,
                required: false
            },
            city: String,
            state: {
                type: ShippingState,
                required: function () {
                    return this.get("country.isoCode") === "US";
                }
            },
            country: ShippingCountry,
            zipCode: String,

            email: String,
            phone: {
                type: String,
                required: false
            },
            fax: {
                type: String,
                required: false
            }
        }
    });

    Address.ADDRESS_TYPES = ADDRESS_TYPES;

    return Address;
});
