define(["js/data/Entity"], function (Entity) {

    var SalutationMap = {
        1: "mr",
        2: "mrs",
        3: "ms",
        4: "company"
    };

    var Salutation = Entity.inherit("sprd.entity.Person.Salutation", {
        defaults: {
            id: null
        },

        schema: {
            id: Number
        },

        contraction: function() {
            return SalutationMap[this.$.id]
        }.onChange("id")

    });

    return Entity.inherit("sprd.entity.Person", {

        defaults: {
            salutation: Salutation,
            firstName: '',
            lastName: ''
        },
        schema: {
            salutation: Salutation,
            firstName: String,
            lastName: String
        },

        salutation: function () {

        }.onChange("salutation")
    });
});