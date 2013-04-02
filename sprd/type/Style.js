define(["text/type/Style","underscore"], function(Style,_) {

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

        _getPrintColorId: function () {
            var printTypeColor = this.$.printTypeColor;
            if (printTypeColor) {
                return printTypeColor.$.id;
            }

            return null;
        },

        compose: function() {

            var ret = this.callBase();

            if (this.$.font) {
                ret.fontFamily = this._getUniqueFontName();
                ret.fontWeight = "normal"; // done via different font
                ret.fontStyle = "normal";
            }

            ret.color = this._getColor();
            ret.printColorId = this._getPrintColorId();

            delete ret.printTypeColor;
            delete ret.font;

            for (var key in ret) {
                if (ret.hasOwnProperty(key) && ret[key] === null) {
                    delete ret[key];
                }
            }

            return ret;
        },

        serialize: function() {
            var font = this.$.font,
                fontFamily = font.getFontFamily();

             return {
                fontFamilyId: fontFamily.$.id,
                fontId: font.$.id,
                printColorId: this._getPrintColorId(),
                fill: this._getColor(),
                fontFamily: font.$.name,
                fontWeight: font.$.weight,
                fontStyle: font.$.style,
                fontSize: this.$.fontSize
            };
        },

        clone: function(){
            return new this.factory(_.clone(this.$));
        }
    });

});