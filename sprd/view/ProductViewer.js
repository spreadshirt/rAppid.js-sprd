define(['js/svg/Svg', 'js/svg/SvgElement', 'sprd/model/Product', 'underscore', 'sprd/data/ImageService', 'sprd/view/svg/PrintAreaViewer', 'sprd/view/svg/ProductTypeViewViewer'],
    function (Svg, SvgElement, Product, _, ImageService, PrintAreaViewer, ProductTypeViewViewer) {

        return Svg.inherit('sprd.view.ProductViewer', {
            defaults: {

                height: 300,
                width: 300,

                // the view to show
                view: null,

                // the product which is rendered
                product: null,

                // private defaults
                _productType: "{product.productType}",
                _appearance: null,
                _view: null,
                selectedConfiguration: null,

                componentClass: "product-viewer {product.appearanceBrightness()}",

                editable: true
            },

            $classAttributes: ["product", "view", "editable", "selectedConfiguration"],

            inject: {
                imageService: ImageService
            },

            ctor: function () {

                this.$productTypeViewViewerCache = {};

                this.callBase();

                this.bind("on:click", this._clickHandler, this);
            },

            _bindDomEvents: function() {
                if (this.runsInBrowser() && this.$.editable) {
                    var window = this.dom(this.$stage.$window),
                        self = this;

                    // TODO: surround product viewer with div and set tabindex="1" on the div, so
                    // it can get a focus: then bind key events directly to product viewer
                    window.bindDomEvent("keydown", function(e) {
                        var product = self.$.product;

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

                            if (deltaX || deltaY) {

                                if (e.shiftKey) {
                                    deltaX *= 10;
                                    deltaY *= 10;
                                }

                                var offset = selectedConfiguration.$.offset;
                                offset.set({
                                    x: offset.$.x + deltaX,
                                    y: offset.$.y + deltaY
                                });
                                selectedConfiguration.set('offset', offset);

                                e.preventDefault();
                            }


                            if (e.keyCode === 46 &&
                                (e.target.localName != "input" && e.target.localName != "textarea")) {
                                // backspace || delete --> remove selected configuration

                                product.$.configurations.remove(selectedConfiguration);
                                self.set('selectedConfiguration', null);

                                e.preventDefault();
                            }
                        }


                    });
                }

                this.callBase();
            },

            initialize: function () {

                this.bind('product.productType', 'change:views', this._onViewsChanged, this);

                this.callBase();
            },

            _removeProductTypeViewViewers: function () {
                // remove all views
                for (var key in this.$productTypeViewViewerCache) {
                    if (this.$productTypeViewViewerCache.hasOwnProperty(key)) {
                        this.$productTypeViewViewerCache[key].remove();
                        this.$productTypeViewViewerCache[key].destroy();
                    }
                }

                this.$productTypeViewViewerCache = {};
            },

            _onViewsChanged: function () {
                this._determinateInternalView();
            },

            _commitView: function () {
                this._determinateInternalView();
            },

            _clickHandler: function(e) {
                if (this.$.editable) {
                    this.set('selectedConfiguration', null);
                }
            },

            _keyDownHandler: function(e) {
                if (this.$.editable) {
                                   console.log(e);
                }
            },

            _determinateInternalView: function () {
                var view = this.$.view,
                    productType = this.$._productType;

                if (productType) {
                    if (view) {
                        // check if view is compatible
                        this.set('_view', productType.getViewById(view.$.id));
                    } else {
                        this.set('_view', productType.getDefaultView());
                    }
                }

            },

            _render_productType: function (productType, oldProductType) {

                oldProductType && this._removeProductTypeViewViewers();

                if (productType) {
                    this._determinateInternalView();
                    this._renderProductTypeView(productType, this.$._view);
                }

            },

            _render_view: function (view) {

                view && this.setViewBox(0, 0, view.get('size.width'), view.get('size.height'));

                this._renderProductTypeView(this.$._productType, view);
            },

            _commitProduct: function(product) {
                var productTypeViewViewerCache = this.$productTypeViewViewerCache;
                for (var key in productTypeViewViewerCache) {
                    if (productTypeViewViewerCache.hasOwnProperty(key)) {
                        productTypeViewViewerCache[key].set('product', product);
                    }
                }
            },

            _renderProductTypeView: function (productType, view) {
                if (productType && view && productType.containsView(view)) {
                    var cacheId = productType.$.id + "_" + view.$.id;

                    view && this.setViewBox(0, 0, view.get('size.width'), view.get('size.height'));

                    if (!this.$productTypeViewViewerCache[cacheId]) {
                        this.$productTypeViewViewerCache[cacheId] = this.createComponent(ProductTypeViewViewer, {
                            product: this.$.product,
                            productViewer: this,

                            _view: view,
                            _productType: productType
                        });
                    }

                    if (this.$currentProductTypeViewViewer) {
                        this.$currentProductTypeViewViewer.remove();
                    }

                    this.$currentProductTypeViewViewer = this.$productTypeViewViewerCache[cacheId];
                    this.addChild(this.$currentProductTypeViewViewer);

                }
            },

            destroy: function () {
                this._removeProductTypeViewViewers();
                this.callBase();
            }

        });


    });