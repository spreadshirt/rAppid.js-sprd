define(["js/data/Entity"], function(Entity) {
    return Entity.inherit("checkout.entity.Payment", {
        type: "payment",

        defaults: {
            root: null
        },

        getType: function() {
            return this.type;
        }
    });
});