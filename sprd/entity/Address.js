define(["js/data/Entity", "sprd/entity/ShippingState", "sprd/entity/ShippingCountry"], function (Entity, ShippingState, ShippingCountry) {

    var Person = Entity.inherit("sprd.entity.Address.Person", {
        defaults: {
            salutation: 99,
            firstName: null,
            lastName: null
        },

        schema: {
            salutation: Number,
            firstName: String,
            lastName: String
        }
    });

    return Entity.inherit("sprd.entity.Address", {

        defaults: {
            type: null,
            company: null,
            person: null,

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
                required: false
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
                required: function() {
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
});
