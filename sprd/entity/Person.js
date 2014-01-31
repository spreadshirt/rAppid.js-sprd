define(["js/data/Entity"], function (Entity) {
    var Salutation = Entity.inherit("sprd.entity.Person.Salutation", {
        defaults: {
            id: null
        },

        schema: {
            id: Number
        }
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
        }
    });
});