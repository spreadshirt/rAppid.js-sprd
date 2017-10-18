define(['xaml!sprd/view/svg/PatternRenderer', "sprd/entity/Size", 'js/core/Bus', 'underscore'], function (PatternRenderer, Size, Bus, _) {

    var timer;
    
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

        $classAttributes: ['textPath', 'path', 'text'],

        inject: {
            bus: Bus
        },

        _initializationComplete: function () {
            this.callBase();
            this.bind("configuration", "change:font", this.loadFont, this);
            this.bind("productViewer.product", ["configurations", "reset"], this.resetMainConfigurationViewer, this);
            this.bind("configuration", "change:printArea", this.resetMainConfigurationViewer, this);
            this.bind("configuration", "change:angle", this.changeAngle, this);

            this.bind("configuration", "change:text", recalculateSize, this);
            this.bind("configuration", "change:angle", recalculateSize, this);
            this.bind("configuration", "change:font", recalculateSize, this);
            this.bind("configuration", "change:fontSize", function() {
                this.recalculateSize(false)
            }, this);

            function recalculateSize() {
                this.recalculateSize(true);
            }
        },

        resetMainConfigurationViewer: function () {
            var configuration = this.$.configuration;
            if (configuration) {
                configuration.mainConfigurationRenderer = null;
            }
        },

        changeAngle: function () {

            var path = this.$.path;

            if (timer) {
                clearTimeout(timer);
            }

            if (path) {
                path.set("selected", true);

                timer = setTimeout(function () {
                    path.set("selected", false);
                }, 1000);
            }
        },

        loadFont: function () {
            var svgRoot = this.getSvgRoot(),
                font = this.get("configuration.font"),
                extension = this.$stage.$browser.isIOS ? "svg#font" : "woff",
                self = this;

            if (!font || !svgRoot) {
                return;
            }

            this.set("loading", true);
            svgRoot.fontManager.loadExternalFont(font.getUniqueFontName(), this.$.imageService.fontUrl(font, extension), function () {
                self.waitForNewRender();
                self.set("loading", false);
            });
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

        recalculateSize: function (scaleToKeepSize) {

            if (scaleToKeepSize == null) {
                scaleToKeepSize = true;
            }

            var textPath = this.$.textPath,
                path = this.$.path,
                text = this.$.text;
            if (textPath && textPath.$el && path && path.$el && text && text.$el) {

                var configuration = this.$.configuration;
                if (configuration && configuration.mainConfigurationRenderer && configuration.mainConfigurationRenderer != this) {
                    return;
                }

                //path fix for IE
                path.set("d", configuration.textPath());
                text.set("dy", configuration.dy());

                configuration.mainConfigurationRenderer = this;

                var textPathRect = textPath.$parent.$el.getBBox();
                var pathRect = path.$el.getBBox();

                configuration.set({
                    textPathOffsetX: 0,
                    textPathOffsetY: 0
                });

                var textBBox = this.$.text.$el.getBBox();

                var _size = configuration.$._size;

                var newWidth = textPathRect.width,
                    oldWidth = _size.$.width,
                    newHeight = textPathRect.height;

                var widthScale = this.divideOrDefault(oldWidth, newWidth, 1),
                    currentScale = configuration.$.scale;

                _size.set({
                    width: newWidth,
                    height: newHeight
                });


                if (scaleToKeepSize) {
                    configuration.set('scale', {
                        x: currentScale.x * widthScale,
                        y: currentScale.y * widthScale
                    });
                } else {
                    this.balanceConfiguration(oldWidth, newWidth);
                }

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


        divideOrDefault: function (a, b, defaultArgument) {
            return b !== 0 ? a / b : defaultArgument;
        },

        removeAttributesOnDescendants: function (node, attributeNames) {
            if (node.nodeType === 1) {
                _.each(attributeNames, function (attributeName) {
                    node.removeAttribute(attributeName);
                });
            }

            var children = node.childNodes;
            for (var i = 0; i < children.length; i++) {
                this.removeAttributesOnDescendants(children.item(i), attributeNames);
            }
        },

        bus_StageRendered: function () {
            this.loadFont();
        }.bus("Stage.Rendered")
    });
});