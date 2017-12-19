define(['xaml!sprd/view/svg/PatternRenderer', 'js/core/Bus'], function(PatternRenderer, Bus) {

    return PatternRenderer.inherit("sprd.view.svg.TextConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            componentClass: "text-configuration",
            productViewer: null,
            configurationViewer: null,
            configuration: null,

            showSelection: "{configurationViewer.isSelectedConfiguration()}",
            textArea: null,

            imageService: null,
            hasSpecialColor: "{hasSpecialColor()}"
        },

        inject: {
            bus: Bus
        },

        ctor: function() {
            this.$firstSelection = true;
            this.callBase();
        },

        and: function(a, b) {
            return a && b
        },

        _loadFonts: function() {

            var configuration = this.$.configuration;

            if (!configuration) {
                return;
            }

            var fonts = configuration.getUsedFonts(),
                svgRoot = this.getSvgRoot(),
                extension = this.$stage.$browser.isIOS ? "svg#font" : "woff";

            this.set('loading', true);
            var self = this;
            var loadedFonts = 0;
            for (var i = 0; i < fonts.length; i++) {
                var font = fonts[i];

                svgRoot.fontManager.loadExternalFont(font.getUniqueFontName(), this.$.imageService.fontUrl(font, extension), function () {
                    loadedFonts++;
                    if (loadedFonts === fonts.length) {
                        self.set('loading', false);
                    }
                });
            }
        },

        bus_StageRendered: function() {
            this._loadFonts();
        }.bus("Stage.Rendered")

    });
});
