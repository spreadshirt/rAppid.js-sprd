define(['sprd/view/svg/ConfigurationRenderer', 'js/core/Bus'], function (ConfigurationRenderer, Bus) {

    return ConfigurationRenderer.inherit("sprd.view.svg.TextConfigurationRendererClass", {

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

        ctor: function () {
            this.$firstSelection = true;
            this.callBase();
        },

        render: function () {
            this._loadFonts();
            return this.callBase();
        },

        isNotMobile: function(){
            return !this.$stage.$browser.isMobile;
        },

        _loadFonts: function () {

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

        _handleClick: function(){
            if(this.$.configuration && this.$.productViewer.$.product.$.restrictions.example){
                this.$.configuration.$.selection.set({
                    anchorIndex: 0,
                    activeIndex: this.$.configuration.$.textFlow.textLength()-1
                });
            }
        },

        handleKeyPress: function (e) {
            this.$.textArea.handleKeyPress(e);
        },

        addChar: function(c) {
            this.$.textArea.addChar(c);
        },

        handleKeyDown: function (e) {
            this.$.textArea.handleKeyDown(e);
        },

        _focus: function() {
            var textArea = this.$.textArea;
            if (textArea) {
                textArea.focus();
            }

        }

    });
});
