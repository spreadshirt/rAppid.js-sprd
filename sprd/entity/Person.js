define(["js/data/Entity", "js/data/validator/RegExValidator"], function (Entity, RegExValidator) {

    var SalutationMap = {
        "1": "mr",
        "2": "mrs",
        "3": "ms",
        "4": "company"
    };

    return Entity.inherit("sprd.entity.Person", {

        defaults: {
            salutation: null,
            firstName: '',
            lastName: ''
        },

        schema: {
            salutation: {type: String, required: false},
            firstName: String,
            lastName: String
        },

        validators: [
            new RegExValidator({
                field: "lastName",
                regEx: /^[0-9a-zA-Z]{0,30}$/,
                errorCode: 'lastNameError'
            }),
            new RegExValidator({
                field: "firstName",
                regEx: /^[0-9a-zA-Z]{0,30}$/,
                errorCode: 'firstNameError'
            })
        ],

        fullName: function () {
            return [(this.$.firstName || ""), (this.$.lastName || "")].join(" ");
        }.onChange("firstName", "lastName"),

        parse: function () {
            var data = this.callBase();
            data.salutation = (data.salutation || {}).id || null;
            return data;
        },

        compose: function () {
            var data = this.callBase();

            if (data.salutation) {
                data.salutation = {
                    id: data.salutation
                };
            }

            return  data;
        },

        contraction: function () {
            return SalutationMap[this.$.salutation];
        }.onChange("salutation")
    });
});