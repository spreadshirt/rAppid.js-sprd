define(["js/ui/View", "js/core/Bus", "sprd/manager/ProductManager", "sprd/data/ImageService"], function (View, Bus, ProductManager, ImageService) {
    return View.inherit('sprd.view.ProductViewerClass', {

        defaults: {
            view: null,
            product: null,
            width: 300,
            height: 300,
            selectedConfiguration: null,
            editable: true,
            focused: true,

            autoDeselectConfiguration: true,
            showConfigurationInformation: false,

            productViewerSvg: null,
            textArea: null,
            textAreaPosition: null,

            removeEmptyTextConfiguration: true,
            bringSelectedConfigurationToFront: true,

            imageService: null,

            error: "{product.configurationsOnViewError(view)}",
            componentClass: "product-viewer",

            copiedConfiguration: null
        },

        inject: {
            bus: Bus,
            productManager: ProductManager,
            imageService: ImageService
        },

        events: ['on:configurationSelect', "on:deselectConfiguration"],

        ctor: function () {
            this.callBase();
            this.bind('productViewerSvg', 'add:configurationViewer', this._onConfigurationViewerAdded, this);
            this.bind('product.configurations', 'reset', this._onConfigurationsReset, this);
            this.bind('product', 'change:configurations', this._onConfigurationsReset, this);
            this.bind('product.configurations', 'remove', function (e) {
                if (e.$.item === this.$.selectedConfiguration) {
                    this.set('selectedConfiguration', null);
                }
            }, this);
            this.bind('selectedConfiguration', 'change:scale', this._positionTextArea, this);
            this.bind('selectedConfiguration', 'change:offset', this._positionTextArea, this);
        },

        _onDomAdded: function () {
            this.callBase();
            if (this.$.editable) {
                // focus stage to enable keyboard interaction
                this.$stage.focus();
            }
        },

        _commitSelectedConfiguration: function (selectedConfiguration, oldSelectedConfiguration) {
            if (this.$.product && oldSelectedConfiguration && (oldSelectedConfiguration.type === "text" || oldSelectedConfiguration.type ===  "specialText")) {
                if (oldSelectedConfiguration.$.isNew) {
                    this.$.product.$.configurations.remove(oldSelectedConfiguration);
                }
                if (this.$.removeEmptyTextConfiguration
                    && oldSelectedConfiguration.$.textFlow) {

                    var text = oldSelectedConfiguration.$.textFlow.text(0, -1);
                    if (/^[\s\n\r]*$/.test(text)) {
                        this.$.product.$.configurations.remove(oldSelectedConfiguration);
                    }
                }

            }

            if (this.isRendered() && selectedConfiguration && !this.$stage.$browser.hasTouch) {
                // when the selection changes make sure to focus the stage to allow keyboard interaction
                // only needed on desktop
                this.$stage.focus();
            }

            if (selectedConfiguration && this.$.textArea && this.$.textArea.isRendered()) {
                this.$.textArea.$el.blur();
                this._positionTextArea();
            }
        },

        keyUp: function (e) {
            if (!this.$stage.$browser.isIOS) {
                return;
            }
            if (this.$keyPressHandled) {
                return;
            }

            // this is a work-a-round because keypress event isn't available on android
            var value = this.$.textArea.$el.value;
            if (this.$lastValue !== value && value && value.length !== 0) {
                // input
                var c = value.substr(-1),
                    viewer = this.$.selectedConfigurationViewer;

                if (c && viewer) {
                    viewer.addChar(c);
                }

            }

            this.$lastValue = value;
            this.$.textArea.$el.value = "";
        },

        keyPress: function (e) {
            if (!this.$stage.$browser.isIOS) {
                return;
            }
            this.$keyPressHandled = true;
            this.$.textArea.$el.value = "";
            this._keyPressHandler(e.domEvent);
        },

        keyDown: function (e) {
            if (!this.$stage.$browser.isIOS) {
                return;
            }
            this.$keyPressHandled = false;
            this._keyDownHandler(e.domEvent);
        },

        _positionTextArea: function () {
            try {
                var position = null,
                    selectedConfiguration = this.$.selectedConfiguration;


                if (!this.$textAreaFocused && this.$.editable && selectedConfiguration && selectedConfiguration.type === "text" && this.$.productViewerSvg && this.$.productViewerSvg.$currentProductTypeViewViewer) {
                    var factor = this.$.productViewerSvg.localToGlobalFactor(),
                        view = this.$.productViewerSvg.$currentProductTypeViewViewer.$._view,
                        viewMap;

                    for (var i = 0; i < view.$.viewMaps.$items.length; i++) {
                        if (view.$.viewMaps.$items[i].$.printArea === selectedConfiguration.$.printArea) {
                            viewMap = view.$.viewMaps.$items[i];
                            break;
                        }
                    }

                    if (viewMap) {
                        position = {
                            x: (viewMap.get("offset.x") + selectedConfiguration.get("offset.x")) * factor.x + 14,
                            y: (viewMap.get("offset.y") + selectedConfiguration.get("offset.y")) * factor.y - 2,
                            width: selectedConfiguration.width() * factor.x - 25,
                            height: selectedConfiguration.height() * factor.y - 10
                        };
                    }

                }

                this.set("textAreaPosition", position);
            } catch (e) {
                if (this.$.bus) {
                    this.$.bus.trigger("Application.Error", e);
                } else {
                    throw e;
                }
            }
        },

        _onConfigurationsReset: function () {
            var configurations = this.$.product.$.configurations,
                selectedConfiguration = this.$.selectedConfiguration;

            if(!configurations.contains(selectedConfiguration)) {
                this.set('selectedConfiguration', null);
            }
        },

        _onConfigurationViewerAdded: function (e) {
            var viewer = e.$;
            if (viewer) {
                if (viewer.$.configuration === this.$.selectedConfiguration) {
                    this.set('selectedConfigurationViewer', viewer);
                }
                this.trigger('add:configurationViewer', viewer);
            }
        },

        _clickHandler: function (e) {
            if (this.$.editable && !(e.isDefaultPrevented || e.defaultPrevented) && e.domEvent && e.domEvent.target !== this.$.textArea.$el) {

                if (this.$.autoDeselectConfiguration)  {
                    this.$.bus.trigger('ProductViewer.configurationSelected', {configuration: null});
                    this.set('selectedConfiguration', null);
                }

                this.trigger("on:deselectConfiguration", {
                    clickEvent: e
                });
            }
            e.preventDefault();
            this.set('focused', true);
        },

        _commitChangedAttributes: function ($) {
            this.callBase();
            if ($ && $.hasOwnProperty('selectedConfiguration')) {
                var configuration = $['selectedConfiguration'],
                    viewer = null;

                if (configuration) {
                    viewer = this.getViewerForConfiguration(configuration);
                }

                this.trigger('on:configurationSelect', configuration);
                this.set('selectedConfigurationViewer', viewer);

                if (this.$.bringSelectedConfigurationToFront && viewer && this.$.product.$.configurations.size() > 1) {
                    // rearange configurations in list
                    this.$.product.$.configurations.remove(configuration, {silent: true});
                    this.$.product.$.configurations.add(configuration, {silent: true});
                    // bring viewer to front
                    // timeout is needed here otherwise IE in windows 8
                    // will throw an additional click event
                    // on the underlying element
                    setTimeout(function () {
                        viewer.bringToFront();
                    }, 2)
                }

            }
        },

        getViewerForConfiguration: function (configuration) {
            if (this.$.productViewerSvg) {
                return this.$.productViewerSvg.getViewerForConfiguration(configuration);
            }
            return null;
        },

        _keyDownHandler: function (e) {
            var self = this,
                product = self.$.product;

            var viewer = this.$.selectedConfigurationViewer;
            if (viewer) {
                viewer._keyDown(e);
                if (e.defaultPrevented) {
                    return;
                }
            }

            var copiedConfiguration = this.$.copiedConfiguration,
                ctrlKey = e.metaKey || e.ctrlKey;

            if (ctrlKey && e.keyCode === 86 && copiedConfiguration) {
                var newConfiguration = copiedConfiguration.clone(),
                    bus = self.$.bus;

                this.$.productManager.moveConfigurationToView(product, newConfiguration, this.$.view, function(err) {
                    if(err) {
                        bus.trigger("errorMessage", {
                            key: "invalidView",
                            value: "error.invalidView"
                        });

                        setTimeout(function() {
                            bus.trigger("errorMessage", null);
                        }, 5000);
                    } else {
                        self.set('selectedConfiguration', newConfiguration);

                        offset = newConfiguration.$.offset;
                        offset.set({
                            x: offset.$.x + 20,
                            y: offset.$.y + 20
                        });

                        newConfiguration.$stage = null;
                        bus.setUp(newConfiguration);
                    }
                });
            }

            var selectedConfiguration = self.$.selectedConfiguration;

            if (selectedConfiguration && product) {

                var deltaX = 0,
                    deltaY = 0;

                switch (e.keyCode) {
                    case 40:
                        deltaY = 1;
                        break;
                    case 38:
                        deltaY = -1;
                        break;
                    case 37:
                        deltaX = -1;
                        break;
                    case 39:
                        deltaX = 1;
                }
                var offset;

                if (deltaX || deltaY) {

                    if (e.shiftKey) {
                        deltaX *= 10;
                        deltaY *= 10;
                    }

                    offset = selectedConfiguration.$.offset.clone();
                    offset.set({
                        x: offset.$.x + deltaX,
                        y: offset.$.y + deltaY
                    });
                    selectedConfiguration.set('offset', offset);

                    this.$configurationMoved = true;
                    e.preventDefault();
                    e.stopPropagation();

                }


                if (e.keyCode === 8 || e.keyCode === 46) {
                    // backspace || delete --> remove selected configuration

                    product.$.configurations.remove(selectedConfiguration);
                    self.set('selectedConfiguration', null);

                    e.preventDefault();
                    e.stopPropagation();
                }

                if (ctrlKey && (e.keyCode === 67 || e.keyCode === 88)) {
                    this.set('copiedConfiguration', selectedConfiguration.clone());

                    if(e.keyCode === 88) {
                        product.$.configurations.remove(selectedConfiguration);
                        self.set('selectedConfiguration', null);
                    }

                    e.preventDefault();
                    e.stopPropagation();
                }
            }

        },

        _keyPressHandler: function (e) {
            var viewer = this.$.selectedConfigurationViewer;
            if (viewer) {
                viewer._keyPress(e);
            }
        },

        _keyUpHandler: function () {
            if (this.$configurationMoved) {
                this.$configurationMoved = false;
                this.$.bus.trigger("Application.productChanged", this.$.product);
            }
        },

        _bindDomEvents: function () {
            if (this.runsInBrowser() && this.$.editable) {
                var self = this;

                this.bind("on:click", this._clickHandler, this);

                this.$stage.bind('on:focus', function () {
                    self.set('focused', true);
                });
                this.callBase();
            }
        },

        textAreaFocused: function () {
            this.set('focused', true);

            if (this.$stage.$browser.isIOS) {
                this.$.textArea.set('visibility', 'hidden');
            } else {
                // android hack
                this.$stage.set('height', this.$stage.$el.offsetHeight);
                var self = this;
                setTimeout(function () {
                    self._positionTextArea();
                    self.$.textArea.set({
                        opacity: 1.0,
                        value: self.$.selectedConfiguration ? self.$.selectedConfiguration.$.textFlow.text(0, -1, "\n").replace(/\n$/, "") : "",
                        _configuration: self.$.selectedConfiguration
                    });
                    self.$.textArea.set('opacity', 1.0);
                }, 1000);
            }

            this.addClass("text-area-active");

        },

        _delegateEvent: function (e) {

            if (this.$stage.$browser.isIOS || this.$.textArea.get('opacity') == 0) {
                this.$.productViewerSvg.$currentProductTypeViewViewer._handleDown(e);
                var viewer = this.$.selectedConfigurationViewer;
                if (viewer) {
                    viewer._down(e.domEvent, viewer._isGesture(e.domEvent) ? "gesture" : "move");
                }

                this.$pointerMoveEventTriggerd = false;
            }

        },
        _textAreaMove: function () {
            this.$pointerMoveEventTriggerd = true;
        },

        _handlePointerUp: function (e) {
            if (!this.$pointerMoveEventTriggerd) {
                e.target.focus();
            }
            if (this.$stage.$browser.isIOS || this.$.textArea.get('opacity') == 0) {
                this.$.productViewerSvg.$currentProductTypeViewViewer._handleUp(e);
            }
        },


        textAreaBlured: function () {
            this.set('focused', false);
            if (this.$stage.$browser.isIOS) {
                this.$.textArea.set('visibility', 'visible');
                var viewer = this.$.selectedConfigurationViewer;
                if (viewer) {
                    viewer.set('focused', false);
                }
            } else {
                // android hack
                var self = this;

                setTimeout(function () {
                    self.$stage.set('height', '100%');
                }, 200);

                if (this.$.textArea.$._configuration) {
                    this.$.productManager.setTextForConfiguration(this.$.textArea.$.value, this.$.textArea.$._configuration);
                }

                self.$.textArea.set('opacity', 0);
            }

            this.removeClass("text-area-active");
        },

        showTextAreaOverlay: function () {
            return this.$.editable &&
                this.$.selectedConfiguration && this.$.selectedConfiguration.type === "text" &&
                this.runsInBrowser() && ('ontouchstart' in window) && this.$stage.$browser.isMobile;
        }.onChange("selectedConfiguration", "editable")
    });
});