define(["js/data/Entity"], function (Entity) {
    return Entity.inherit("sprd.entity.Person", {
        defaults: {
            salutation: 1,
            firstName: '',
            lastName: ''
        },
        schema: {
            salutation: Number,
            firstName: String,
            lastName: String
        }
    });
});