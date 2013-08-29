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
        },

        getUniqueFontName: function() {
            return "sprdfont_" + this.$.id;
        },

        isBold: function() {
            return this.$.weight === "bold";
        }.onChange("weight"),

        isItalic: function () {
            return this.$.style === "italic";
        }.onChange("style")

    });
});
