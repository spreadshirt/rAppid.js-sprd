define(["js/data/Entity"], function(Entity) {
    return Entity.inherit("checkout.entity.Payment", {
        type: "payment",

        getType: function() {
            return this.type;
        }
    });
});