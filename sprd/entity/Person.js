define(["js/data/Entity"], function (Entity) {

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
                }
            }

            return  data;
        },

        contraction: function () {
            return SalutationMap[this.$.salutation]
        }.onChange("id")
    });
});