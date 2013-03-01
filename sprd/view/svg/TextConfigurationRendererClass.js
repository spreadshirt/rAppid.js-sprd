define(['sprd/view/svg/ConfigurationRenderer', 'sprd/data/ImageService'], function (ConfigurationRenderer, ImageService) {

    return ConfigurationRenderer.inherit("sprd.view.svg.TextConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            componentClass: "text-configuration",
            productViewer: null,
            configurationViewer: null,
            configuration: null,

            showSelection: "{configurationViewer.isSelectedConfiguration()}",
            textArea: null
        },

        inject: {
            imageService: ImageService
        },

        ctor: function () {
            this.$firstSelection = true;
            this.callBase();
        },

        _initialize: function () {
            this.callBase();
            this._loadFonts();
        },

        _commitShowSelection: function (showSelection) {

            var configuration = this.$.configuration;
            if (showSelection && this.$.textArea && this.$firstSelection && configuration && configuration.$.textFlow) {

                var selection = this.$.textArea.getSelection();

                if (selection) {
                    this.$firstSelection = false;
                    selection.set({
                        activeIndex: configuration.$.textFlow.textLength() - 1,
                        anchorIndex: 0
                    });
                }
            }
        },

        _loadFonts: function () {

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

        handleKeyPress: function (e) {
            this.$.textArea.handleKeyPress(e);
        },

        handleKeyDown: function (e) {
            this.$.textArea.handleKeyDown(e);
        }

    });
});
