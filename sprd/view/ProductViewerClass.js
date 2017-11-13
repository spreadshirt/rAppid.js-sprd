define(["js/ui/View", "js/core/Bus", "sprd/manager/ProductManager", "sprd/data/ImageService", "designer/manager/FeatureManager", "sprd/entity/ConcreteElement"], function (View, Bus, ProductManager, ImageService, FeatureManager, ConcreteElement) {
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

            removeEmptyTextConfiguration: true,
            removeNewConfigurations: false,
            bringSelectedConfigurationToFront: true,

            imageService: null,

            error: "{product.configurationsOnViewError(view)}",
            componentClass: "product-viewer",

            copiedConfiguration: null,
            zoomToPrintArea: 0,
            zoomToConfiguration: null,
            maxZoom: 1
        },

        inject: {
            bus: Bus,
            productManager: ProductManager,
            imageService: ImageService,
            featureManager: FeatureManager,
            concreteElement: ConcreteElement
        },

        events: ['on:configurationSelect', "on:deselectConfiguration"],

        ctor: function () {
            this.callBase();
            this.bind('productViewerSvg', 'add:configurationViewer', this._onConfigurationViewerAdded, this);
            this.bind('product.configurations', 'reset', this._onConfigurationsReset, this);
            this.bind('product', 'change:configurations', this._onConfigurationsReset, this);
            this.bind('product.configurations', 'remove', this._onConfigurationRemoved , this);
            this.bind('product.configurations', 'add', this._onConfigurationAdded, this);
        },

        _initializationComplete: function () {
            this.callBase();
            var product = this.$.product;

            if (!product) {
                return;
            }

            var configurations = product.getConfigurationsOnView();

            if (configurations.length === 0) {
                return;
            }

            this.set('selectedConfiguration', configurations[0]);
        },

        _commitSelectedConfiguration: function (selectedConfiguration, oldSelectedConfiguration) {
            var activeElement = document.activeElement;
            selectedConfiguration && activeElement && activeElement.blur && activeElement.blur();
            if (this.$.product && oldSelectedConfiguration && (oldSelectedConfiguration.type === "text" || oldSelectedConfiguration.type === "specialText")) {
                if (oldSelectedConfiguration.$.isNew && this.$.removeNewConfigurations) {
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
        },

        _commitView: function (view) {
            if (view) {
                this.set('selectedConfiguration', null);
            }
        },

        _onConfigurationAdded: function (e) {
            var product = this.$.product,
                configsOnCurrentView = product.getConfigurationsOnView(),
                addedConfig = e.$.item;

            if (addedConfig && _.indexOf(configsOnCurrentView, addedConfig) !== -1) {
                this.set('selectedConfiguration', e.$.item);
            }
        },

        _onConfigurationRemoved: function (e) {
            if (e.$.item === this.$.selectedConfiguration) {
                this.set('selectedConfiguration', null);
            }
        },

        keyUp: function (e) {

        },

        keyPress: function (e) {
            this._keyPressHandler(e.domEvent);
        },

        keyDown: function (e) {
            this._keyDownHandler(e.domEvent);
        },

        _onConfigurationsReset: function () {
            var configurations = this.$.product.$.configurations,
                selectedConfiguration = this.$.selectedConfiguration;

            if (!configurations.contains(selectedConfiguration)) {
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
            if (this.$.editable && !(e.isDefaultPrevented || e.defaultPrevented)) {

                var previousSelectedConfiguration = this.$.selectedConfiguration;

                if (this.$.autoDeselectConfiguration) {
                    this.$.bus.trigger('ProductViewer.configurationSelected', {configuration: null});
                    this.set('selectedConfiguration', null);
                }

                this.trigger("on:deselectConfiguration", {
                    clickEvent: e,
                    selectedConfiguration: this.$.selectedConfiguration,
                    previousSelectedConfiguration: previousSelectedConfiguration
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

        getConfigurationsOnActiveView: function (configurations) {
            var self = this,
                printArea = null,
                view = null;

            return configurations.$items.filter(function (configuration) {
                printArea = configuration.$.printArea;
                view = self.$.view;
                return view.containsPrintArea(printArea)
            });
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

            var enableCopyPaste = this.$.featureManager.$.enableCopyPaste;

            if (ctrlKey && e.keyCode === 86 && copiedConfiguration && enableCopyPaste) {
                var newConfiguration = copiedConfiguration.clone(),
                    bus = self.$.bus;

                e.preventDefault();
                e.stopPropagation();

                this.$.productManager.moveConfigurationToView(product, newConfiguration, this.$.view, {respectTransform: true}, function (err) {
                    if (err) {
                        bus.trigger("ProductViewer.copyToViewError", err);
                        newConfiguration = null;
                    } else {
                        var configurations = self.$.product.$.configurations,
                            configurationsOnView = self.getConfigurationsOnActiveView(configurations).filter(function (c) {
                                return c !== newConfiguration
                            });

                        var newOffset = newConfiguration.$.offset,
                            newX = Math.round(newOffset.$.x),
                            newY = Math.round(newOffset.$.y);

                        var shift = Math.round((newConfiguration.get("printArea.boundary.size.width") || 500) / 10);

                        for (var i = 0; i < configurationsOnView.length; i++) {

                            var foundConfigurationOnSamePosition = false;

                            for (var j = 0; j < configurationsOnView.length; j++) {
                                var configuration = configurationsOnView[j];

                                var offset = configuration.$.offset,
                                    x = Math.round(offset.$.x),
                                    y = Math.round(offset.$.y);

                                if ((newX == x) && (newY == y)) {
                                    foundConfigurationOnSamePosition = true;
                                    break;
                                }
                            }

                            if (foundConfigurationOnSamePosition) {
                                newX += shift;
                                newY += shift;
                            } else {
                                break;
                            }
                        }

                        newOffset.set({
                            x: newX,
                            y: newY
                        });


                        newConfiguration.$stage = null;
                        bus.setUp(newConfiguration);

                        if (newConfiguration.type == "specialText") {
                            newConfiguration.fetchImage();
                        }
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

                if (ctrlKey && (e.keyCode === 67 || e.keyCode === 88) && enableCopyPaste) {
                    this.set('copiedConfiguration', selectedConfiguration.clone());

                    if (e.keyCode === 88) {
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
        }
    });
});