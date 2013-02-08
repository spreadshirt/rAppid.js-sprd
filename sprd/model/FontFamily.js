define(["sprd/data/SprdModel", "sprd/model/PrintType", "sprd/entity/Font"], function (SprdModel, PrintType, Font) {
    return SprdModel.inherit("sprd.model.FontFamily", {

        schema: {
            printTypes: [PrintType],
            fonts: [Font],
            deprecated: Boolean
        },

        getFont: function (fontWeight, fontStyle) {
            fontWeight = fontWeight || "normal";
            fontStyle = fontStyle || "normal";

            for (var i = 0; i < this.$.fonts.$items.length; i++) {
                var font = this.$.fonts.$items[i];
                if (font.$.weight === fontWeight || font.$.style === fontStyle) {
                    return font;
                }
            }

            return null;

        },

        getDefaultFont: function () {

            if (!this.$.fonts) {
                return null;
            }

            return this.$.fonts.at(0);
        }

    })
});
