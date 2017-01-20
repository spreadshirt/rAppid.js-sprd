define(['xaml!sprd/view/svg/SpecialFlexConfigurationRenderer', "sprd/entity/Size"], function(SpecialFlexConfigurationRenderer, Size) {

    return SpecialFlexConfigurationRenderer.inherit("sprd.view.svg.BendingTextConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            componentClass: "bendingText-configuration",
            productViewer: null,
            configurationViewer: null,
            configuration: null,

            textPath: null,
            path: null,

            oldSize: null
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

        _initializationComplete: function() {
            this.callBase();
            this.loadFont();
            this.bind("configuration", "recalculateSize", this.balanceConfiguration, this);
        },

        render: function() {
            if (this.$stage && this.$stage.$el && this.$stage.$el.parentNode) {
                this.loadFont();
            }

            return this.callBase();
        },

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

                configuration.set({
                    _size: new Size({
                        width: textPathRect.width,
                        height: textPathRect.height
                    }),
                    textPathOffsetX: (textPathRect.width - pathRect.width) * 0.5,
                    textPathOffsetY: -textBBox.y
                });

                configuration.trigger("sizeChanged");
            }
        },

        balanceConfiguration: function() {
            var configuration = this.$.configuration;
            if (configuration) {
                var oldSize = this.$.oldSize,
                    newSize = configuration.$._size,
                    scale = configuration.$.scale.x;

                if (oldSize) {
                    var offset = configuration.$.offset;
                    configuration.$.offset.set({
                        x: offset.$.x - ((newSize.$.width - oldSize.$.width) / 2 ) * (scale / this.$.normalScale)
                    });
                } else {
                    this.set("normalScale", configuration.$.scale.x)
                }

                this.set("oldSize", newSize);
            }
        },

        getPrintColor: function() {
            var configuration = this.$.configuration,
                printColors = configuration.$.printColors,
                printColor = null;

            if (printColors && printColors.size() && !this.isSpecialFlex()) {
                printColor = printColors.at(0).toHexString();
            }

            return printColor;
        }.on(["configuration.printColors", "reset"]).onChange("configuration.printType")

    });
});