define(["sprd/data/SprdModel", "sprd/model/PrintType", "sprd/entity/Font"], function (SprdModel, PrintType, Font) {
    return SprdModel.inherit("sprd.model.FontFamily", {

        schema: {
            printTypes: [PrintType],
            fonts: [Font],
            deprecated: Boolean
        },

        getFont: function (fontWeight, fontStyle) {

            if (fontWeight === true) {
                fontWeight = "bold";
            } else if (fontWeight === false) {
                fontWeight = "normal";
            }

            if (fontStyle === true) {
                fontStyle = "italic";
            } else if (fontStyle === false) {
                fontStyle = "normal";
            }

            fontWeight = fontWeight || "normal";
            fontStyle = fontStyle || "normal";

            for (var i = 0; i < this.$.fonts.$items.length; i++) {
                var font = this.$.fonts.$items[i];
                if (font.$.weight === fontWeight && font.$.style === fontStyle) {
                    return font;
                }
            }

            return null;

        },

        getNearestFont: function(bold, italic) {

            var font = this.getFont(bold, italic);

            if (!font && italic) {
                font = this.getFont(bold, false);
            }

            if (!font && bold) {
                font = this.getFont(false, italic);
            }

            return font || this.getDefaultFont();
        },

        getDefaultFont: function () {

            if (!this.$.fonts) {
                return null;
            }

            return this.$.fonts.at(0);
        },

        getFontById: function(fontId) {

            var fonts = this.$.fonts.$items;

            for (var i = 0; i < fonts.length; i++) {
                if (fonts[i].$.id == fontId) {
                    return fonts[i];
                }
            }

            return null;
        },

        _supports: function(what) {

            if (!this.$.fonts) {
                return false;
            }

            var fonts = this.$.fonts.$items;

            for (var i = 0; i < fonts.length; i++) {
                if (fonts[i][what] && fonts[i][what]()) {
                    return true;
                }
            }

            return false;
        },

        supportsBold: function() {
            return this._supports("isBold");
        }.onChange("fonts"),

        supportsItalic: function () {
            return this._supports("isItalic");
        }.onChange("fonts")

    })
});
