define(['js/svg/SvgElement', "xaml!sprd/view/svg/PrintAreaViewer", "xaml!sprd/view/DndImage"], function (SvgElement, PrintAreaViewer, DndImage) {


    var dndObject = null,
        productTypeViewViewer = [];

    function findProductTypeViewViewer(x, y, requestor) {
        var ret = null;
        for (var i = 0; i < productTypeViewViewer.length; i++) {
            var viewer = productTypeViewViewer[i];
            if (viewer !== requestor && viewer.isPointInElement(x, y)) {
                return viewer;
            }
        }

        return ret;

    }

    return SvgElement.inherit('sprd.view.svg.ProductTypeViewViewer', {

        defaults: {
            tagName: "g",
            componentClass: "product-type-view",

            product: null,

            productViewer: null,

            dropHovered: false,

            _width: "{productViewer.width}",
            _height: "{productViewer.height}",
            _appearance: "{product.appearance}",


            _view: null,
            _productType: null,

            imageService: null
        },

        $classAttributes: ["productViewer", "product", "imageService"],

        ctor: function () {
            this.$printAreas = [];

            this.callBase();

            productTypeViewViewer.push(this);
        },

        url: function () {
            if (this.$.imageService && this.$._productType && this.$._view && this.$._productType.containsAppearance(this.$._appearance)) {
                return this.$.imageService.productTypeImage(this.$._productType.$.id, this.$._view.$.id, this.$._appearance.$.id, {
                    width: Math.max(this.$._width, this.$._height),
                    height: Math.max(this.$._width, this.$._height)
                });
            }

            return "";
        }.onChange("_width", "_height", "_appearance"),

        isPointInElement: function (x, y) {

            if (this.$el) {
                var clientRect = this.$el.getBoundingClientRect();
                return clientRect.left < x && clientRect.right > x && clientRect.top < y && clientRect.bottom > y;
            }
            return false;

        },

        checkForDropHover: function (x, y) {
            this.set('dropHovered', this.isPointInElement(x, y));
        },

        _initializeRenderer: function () {

            var width = this.get("_view.size.width");
            var height = this.get("_view.size.height");

            if (width < 0 || height < 0) {
                width = height = 500;
            }

            this.$productTypeImage = this.createComponent(SvgElement, {
                tagName: "image",
                href: "{url()}",
                x: 0,
                y: 0,
                width: width,
                height: height
            });

            this.addChild(this.$productTypeImage);

            this.$dndImage = this.createComponent(DndImage, {
                visible: false
            });
            this.$stage.addChild(this.$dndImage);

            this.callBase();

        },

        _removePrintAreas: function () {
            for (var i = 0; i < this.$printAreas.length; i++) {
                var printArea = this.$printAreas[i];
                printArea.remove();
                printArea.destroy();
            }

            this.$printAreas = [];
        },

        _bindDomEvents: function () {
            this.callBase();
            this.bind('on:pointerup', this._handleUp, this);
            this.bind('on:pointerdown', this._handleDown, this);
        },

        bindMoveEvent: function () {
            var self = this;
            if (!this.$moveHandler) {
                this.$moveHandler = function (e) {
                    if (dndObject) {
                        var clientRect = dndObject.boundingRect,
                            configViewer = dndObject.configurationViewer,
                            pointerEvent = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e,
                            x = pointerEvent.clientX,
                            y = pointerEvent.clientY;

                        if (configViewer.$._mode == "move" && !configViewer.$moveInitiator) {
                            self._debounceFunctionCall(function (x, y) {
                                console.log("check");
                                for (var i = 0; i < productTypeViewViewer.length; i++) {
                                    if (productTypeViewViewer[i] !== self) {
                                        productTypeViewViewer[i].checkForDropHover(x, y);
                                    }
                                }
                            }, "setHoverState", 100, self, [x, y], "BOUNCE");

                            if (clientRect.left > x || clientRect.right < x || clientRect.top > y || clientRect.bottom < y) {
                                if (configViewer) {
                                    configViewer.$.configuration.clearErrors();
                                    configViewer.set('preventValidation', true);
                                    configViewer.addClass('hide-configuration');
                                    dndObject.dndImage.set({
                                        'visible': true,
                                        'left': x,
                                        'top': y
                                    });
                                }
                            } else {
                                configViewer.set('preventValidation', false);
                                configViewer && configViewer.removeClass('hide-configuration');
                                dndObject.dndImage.set({
                                    'visible': false
                                });

                            }
                        }
                    }
                }
            }
            if (!this.$upHandler) {
                this.$upHandler = function (e) {
                    self._handleUp({
                        domEvent: e
                    });
                };
            }
            this.dom(this.$stage.$window).bindDomEvent('pointerup', this.$upHandler);
            this.dom(this.$stage.$window).bindDomEvent('pointermove', this.$moveHandler);
        },
        unbindMoveEvent: function () {
            if (this.$moveHandler) {
                this.dom(this.$stage.$window).unbindDomEvent('pointermove', this.$moveHandler);
            }
            if (this.$upHandler) {
                this.dom(this.$stage.$window).unbindDomEvent('pointerup', this.$upHandler);
            }
        },
        _handleUp: function (e) {
            var domEvent = e.domEvent;
            if (dndObject) {
                var viewer = this;
                dndObject.viewer.unbindMoveEvent();
                if (domEvent.changedTouches && domEvent.changedTouches.length) {
                    viewer = findProductTypeViewViewer(domEvent.changedTouches[0].clientX, domEvent.changedTouches[0].clientY, viewer);
                }
                var configView = dndObject.configurationViewer;
                if (viewer && dndObject.viewer !== viewer) {
                    e.stopPropagation();
                    configView.$moving = false;
                    viewer.set('dropHovered', false);

                    var productManager = dndObject.viewer.get('product.manager');
                    productManager.moveConfigurationToView(dndObject.viewer.$.product, dndObject.config, viewer.$._view, function (err) {
                        if (!err) {
                            dndObject.viewer.$.product.set('view', viewer.$._view);
                        }
                    });
                    configView.set('preventValidation', false);
                }
                dndObject.configurationViewer.removeClass('hide-configuration');
                dndObject.dndImage.set({
                    'visible': false
                });
                dndObject = null;
            }
        },


        _handleDown: function () {
            var productViewer = this.$.productViewer,
                selectedConfiguration = productViewer.$.selectedConfiguration;
            if (selectedConfiguration && this.$printAreas.length && !dndObject) {
                var target = this.$printAreas[0],
                    configViewer = this.getViewerForConfiguration(selectedConfiguration);

                this.$dndImage.set('configurationViewer', configViewer, {force: true});

                dndObject = {
                    boundingRect: target.getStaticBoundingRect(),
                    config: selectedConfiguration,
                    configurationViewer: this.getViewerForConfiguration(selectedConfiguration),
                    viewer: this,
                    dndImage: this.$dndImage
                };
                this.bindMoveEvent();
            }
        },

        _render_view: function (view) {

            this._removePrintAreas();

            if (view) {

                for (var i = 0; i < view.$.viewMaps.$items.length; i++) {
                    var viewMap = view.$.viewMaps.$items[i];

                    var printAreaViewer = this.createComponent(PrintAreaViewer, {
                        product: this.$.product,
                        productTypeViewViewer: this,
                        productViewer: this.$.productViewer,

                        _viewMap: viewMap,

                        imageService: this.$.imageService
                    });

                    this.addChild(printAreaViewer);
                    this.$printAreas.push(printAreaViewer);

                }

            }
        },

        _renderDropHovered: function (hovered) {
            if (this.$.productViewer) {
                if (hovered) {
                    this.$.productViewer.addClass('drop-hover');
                } else {
                    this.$.productViewer.removeClass('drop-hover');
                }
            }
        },

        getViewerForConfiguration: function (configuration) {
            var viewer;
            for (var i = 0; i < this.$printAreas.length; i++) {
                viewer = this.$printAreas[i].getViewerForConfiguration(configuration);
                if (viewer) {
                    return viewer;
                }
            }
            return null;
        },

        _commitProduct: function (product) {
            for (var i = 0; i < this.$printAreas.length; i++) {
                this.$printAreas[i].set('product', product);
            }
        },

        destroy: function () {

            this._removePrintAreas();
            this.callBase();
        }

    });
});