define(['xaml!sprd/view/svg/SpecialFlexConfigurationRenderer', 'js/core/Bus'], function(SpecialFlexConfigurationRenderer, Bus) {

    return SpecialFlexConfigurationRenderer.inherit("sprd.view.svg.TextConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            componentClass: "text-configuration",
            productViewer: null,
            configurationViewer: null,
            configuration: null,

            showSelection: "{configurationViewer.isSelectedConfiguration()}",
            textArea: null,

            imageService: null
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

            for (var i = 0; i < fonts.length; i++) {
                var font = fonts[i];
                svgRoot.fontManager.loadExternalFont(font.getUniqueFontName(), this.$.imageService.fontUrl(font, extension));
            }
        },

        bus_StageRendered: function() {
            this._loadFonts();
        }.bus("Stage.Rendered")

    });
});
