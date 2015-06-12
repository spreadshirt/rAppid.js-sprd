define(["js/data/Model"], function (Model) {

    return Model.inherit("sprd.pimp.model.Font", {

        defaults: {
            supportedGlyphs: null
        },

        schema: {
            title: String,
            restrict: String,
            icon: String,
            iconBig: String
        },

        parse: function(data) {
            var glyphs;
            try {
                glyphs = decodeURIComponent(data.restrict || "");
            } catch (e) {
                glyphs = data.restrict;
            }

            var supportedGlyphs = (glyphs || "").split("");

            for (var i = 0; i < supportedGlyphs.length; i++) {
                supportedGlyphs[i] = supportedGlyphs[i].toLowerCase();
            }


            data.supportedGlyphs = supportedGlyphs;
            return data;
        }

    });
});