define(["js/data/Entity"], function (Entity) {
    return Entity.inherit("sprd.entity.Font", {

        schema: {
            name: String,
            weight: String,
            style: String,
            minimalSize: Number
        },

        getFontFamily: function() {
            return this.$parent;
        }

    })
});
