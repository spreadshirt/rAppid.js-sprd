define(['xaml!sprd/view/svg/PatternRenderer', "sprd/entity/Size", 'js/core/Bus'], function(PatternRenderer, Size, Bus) {

    return PatternRenderer.inherit("sprd.view.svg.BendingTextConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            componentClass: "bendingText-configuration",
            productViewer: null,
            configurationViewer: null,
            configuration: null,

            textPath: null,
            path: null
        },

        $classAttributes: ['textPath', 'path', 'text', 'oldSize'],

        inject: {
            bus: Bus
        },

        ctor: function() {
            this.callBase();
            this.bind("dom:add", this.recalculateSize, this);

            this.bind("configuration", "recalculateSize", this.recalculateSize, this);

            this.bind("configuration", "change:font", this.loadFont, this);

            var resetMainConfigurationViewer = function() {
                var configuration = this.$.configuration;
                if (configuration) {
                    configuration.mainConfigurationRenderer = null;
                }
            };

            this.bind("productViewer.product", ["configurations", "reset"], resetMainConfigurationViewer, this);
            this.bind("configuration", "change:printArea", resetMainConfigurationViewer, this);

            var timer = null;
            this.bind("configuration", "change:angle", function() {
                var path = this.$.path;

                if (timer) {
                    clearTimeout(timer);
                }

                if (path) {
                    path.set("selected", true);

                    timer = setTimeout(function() {
                        path.set("selected", false);
                    }, 1000);
                }
            }, this);
        },

        // _initializationComplete: function() {
        //     this.callBase();
        //     // this.bind("configuration", "recalculateSize", this.balanceConfiguration, this);
        // },


        loadFont: function() {
            var svgRoot = this.getSvgRoot(),
                font = this.get("configuration.font"),
                extension = this.$stage.$browser.isIOS ? "svg#font" : "woff",
                self = this;

            if (!font || !svgRoot) {
                return;
            }

            svgRoot.fontManager.loadExternalFont(font.getUniqueFontName(), this.$.imageService.fontUrl(font, extension), function() {
                self.recalculateSize();
            });
        },

        recalculateSize: function() {
            var textPath = this.$.textPath;
            var path = this.$.path;
            if (textPath && textPath.$el && path && path.$el) {

                var configuration = this.$.configuration;
                if (configuration && configuration.mainConfigurationRenderer && configuration.mainConfigurationRenderer != this) {
                    return;
                }

                //path fix for IE
                path.set("d", configuration.$.textPath || "");
                var text = this.$.text;
                text.set("dy", configuration.$.dy);

                configuration.mainConfigurationRenderer = this;

                var textPathRect = textPath.$parent.$el.getBBox();
                var pathRect = path.$el.getBBox();

                configuration.set({
                    textPathOffsetX: 0,
                    textPathOffsetY: 0
                });

                var textBBox = this.$.text.$el.getBBox();

                var _size = configuration.$._size;
                this.balanceConfiguration(_size.$.width, textPathRect.width);
                _size.set({
                    width: textPathRect.width,
                    height: textPathRect.height
                });

                configuration.set({
                    textPathOffsetX: (textPathRect.width - pathRect.width) * 0.5,
                    textPathOffsetY: -textBBox.y
                });

                configuration._setError(configuration._validateTransform({
                    validateHardBoundary: true
                }));

                configuration.trigger("sizeChanged");
            }
        },

        balanceConfiguration: function(oldWidth, newWidth) {
            var configuration = this.$.configuration;
            if (configuration && oldWidth && newWidth) {
                var offset = configuration.$.offset;
                configuration.$.offset.set({
                    x: offset.$.x + ((oldWidth - newWidth) || 0) / 2
                });
            }
        },

        getPrintColor: function() {
            var configuration = this.$.configuration,
                printColors = configuration.$.printColors,
                printColor = null;

            if (printColors && printColors.size() && !this.isSpecialFlex() && !this.isFlock()) {
                printColor = printColors.at(0).toHexString();
            }

            return printColor;
        }.on(["configuration.printColors", "reset"]).onChange("configuration.printType"),

        bus_StageRendered: function() {
            this.loadFont();
        }.bus("Stage.Rendered")
    });
});