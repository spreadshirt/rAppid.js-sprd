define(['sprd/view/svg/ConfigurationRenderer', 'underscore'], function(ConfigurationRenderer, _) {

    return ConfigurationRenderer.inherit("sprd.view.svg.TextConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            componentClass: "text-configuration"
        },

        _initialize: function() {

            this.callBase();

            var fonts = this.getFonts(),
                svgRoot = this.getSvgRoot();

            for (var i = 0; i < fonts.length; i++) {
                var font = fonts[i];
                svgRoot.fontManager.loadExternalFont(font.getUniqueFontName(), "fonts/svg/" + font.$.id + ".svg#font");
            }
        },

        getFonts: function() {
            var fonts = [];

            var configuration = this.$.configuration;
            if (configuration && configuration.$.textFlow) {
                addFonts(configuration.$.textFlow);
            }

            return fonts;

            function addFonts(flowElement) {
                if (flowElement) {
                    var font = flowElement.get("style.font");

                    if (font && _.indexOf(fonts, font) === -1) {
                        fonts.push(font);
                    }

                    !flowElement.isLeaf && flowElement.$.children.each(function(child) {
                        addFonts(child);
                    });
                }
            }
        }

    });
});
