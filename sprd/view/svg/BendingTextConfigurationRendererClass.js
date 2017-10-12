define(['xaml!sprd/view/svg/PatternRenderer', "sprd/entity/Size", 'js/core/Bus', 'underscore'], function(PatternRenderer, Size, Bus, _) {

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
            this.bind("dom:add", this.waitForNewRender, this);

            this.bind("configuration", "recalculateSize", this.waitForNewRender, this);
            this.bind("renderingFinished", this.recalculateSize, this);



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
            this.bind("configuration", "change:font", this.loadFont, this);
        },

        loadFont: function() {
            var svgRoot = this.getSvgRoot(),
                font = this.get("configuration.font"),
                extension = this.$stage.$browser.isIOS ? "svg#font" : "woff",
                self = this;

            if (!font || !svgRoot) {
                return;
            }

            this.set("loading", true);
            svgRoot.fontManager.loadExternalFont(font.getUniqueFontName(), this.$.imageService.fontUrl(font, extension), function() {
                self.waitForNewRender();
                self.set("loading", false);
            });
        },

        waitForNewRender: function () {
            var textEl = this.$.text.$el,
                config = this.$.configuration,
                newText = config.$.text,
                newPath = config.textPath(),
                newFont = config.$.font,
                newFontSize = config.$.fontSize,
                self = this;

            function checkIfRendered() {
                var values = self.getRenderedValues.apply(self);

                var textEqual = values.text === newText,
                    pathEqual = values.path === newPath,
                    fontEqual = values.font === newFont.getUniqueFontName(),
                    fontSize = values.fontSize == newFontSize,
                    isFontLoading = self.$.loading;

                if (textEqual && pathEqual && fontEqual && fontSize && !isFontLoading) {
                    self.trigger("renderingFinished");
                } else {
                    setTimeout(checkIfRendered, 100);
                }
            }

            checkIfRendered()
        },

        getRenderedValues: function () {
            var textEl = this.$.text.$el,
                pathEl = this.$.path.$el;
            
            return {
                text: textEl.textContent.trim(),
                font: textEl.getAttribute("font-family"),
                fontSize: textEl.getAttribute("font-size"),
                path: pathEl.getAttribute("d")
            }
        },

        recalculateSize: function() {
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


                configuration.set('scale', {
                    x: currentScale.x * widthScale,
                    y: currentScale.y * widthScale
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


        divideOrDefault: function(a, b, defaultArgument) {
            return b !== 0 ? a / b : defaultArgument;
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

        removeElementsBlackListTags: function(node, tagList) {
            var children = node.childNodes,
                toBeRemovedChildren = [];
            for (var i = 0; i < children.length; i++) {
                var child = children.item(i);
                if (tagList.indexOf(child.localName) === -1) {
                    toBeRemovedChildren.push(child);
                }
            }

            _.each(toBeRemovedChildren, function(child) {
                child.parentNode.removeChild(child);
            })
        },

        removeAttributesOnDescendants: function(node, attributeNames) {
            if (node.nodeType === 1) {
                _.each(attributeNames, function(attributeName) {
                    node.removeAttribute(attributeName);
                });
            }

            var children = node.childNodes;
            for (var i = 0; i < children.length; i++) {
                this.removeAttributesOnDescendants(children.item(i), attributeNames);
            }
        },

        bus_StageRendered: function() {
            this.loadFont();
        }.bus("Stage.Rendered")
    });
});