define(['sprd/view/svg/ConfigurationRenderer', 'sprd/data/ImageService'], function(ConfigurationRenderer, ImageService) {

    return ConfigurationRenderer.inherit("sprd.view.svg.TextConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            componentClass: "text-configuration",
            productViewer: null,
            configurationViewer: null,
            configuration: null
        },

        inject: {
            imageService: ImageService
        },

        _initialize: function() {
            this.callBase();
            this._loadFonts();
        },

        _loadFonts: function() {

            var configuration = this.$.configuration;

            if (!configuration) {
                return;
            }

            var fonts = configuration.getUsedFonts(),
                svgRoot = this.getSvgRoot();

            for (var i = 0; i < fonts.length; i++) {
                var font = fonts[i];
                svgRoot.fontManager.loadExternalFont(font.getUniqueFontName(), this.$.imageService.fontUrl(font));
            }
        },

        handleKeyPress: function(e){
            this.$.textArea.handleKeyPress(e);
        },

        handleKeyDown: function(e){
            this.$.textArea.handleKeyDown(e);
        }

    });
});
