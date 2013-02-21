define(["text/type/Style"], function(Style) {

    return Style.inherit({

        _getUniqueFontName: function() {
            var font = this.$.font;
            if (font) {
                return font.getUniqueFontName();
            }

            return null;
        },

        _getColor: function() {
            var printTypeColor = this.$.printTypeColor;
            if (printTypeColor) {
                return printTypeColor.toHexString();
            }

            return null;
        },

        compose: function() {

            var ret = this.callBase();

            ret.fontFamily = this._getUniqueFontName();
            ret.fontWeight = "normal"; // done via different font
            ret.fontStyle = "normal";
            ret.color = this._getColor();

            return ret;
        }
    });

});