define(['js/svg/Svg', 'sprd/data/ImageService', 'sprd/view/svg/ProductTypeViewViewer'],
    function (Svg, ImageService, ProductTypeViewViewer) {

        return Svg.inherit('sprd.view.ProductViewerSvg', {
            defaults: {

                height: 300,
                width: 300,
                viewBoxObj: null,
                // the view to show
                view: null,

                // the product which is rendered
                product: null,

                // private defaults
                _productType: "{product.productType}",
                _appearance: null,
                _view: null,
                selectedConfiguration: null,

                selected: "{selectedConfiguration}",

                componentClass: "product-viewer {product.appearance.brightness()}",

                editable: true,
                zoomToPrintArea: 0,
                maxZoom: 1
            },

            $classAttributes: ["product", "view", "editable", "selectedConfiguration", "imageService", "viewBoxObj", "zoomToPrintArea", "maxZoom"],

            ctor: function () {

                this.$productTypeViewViewerCache = {};

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


                if (!view) {
                    return
                }

                var width = view.get('size.width');
                var height = view.get('size.height');

                if (width < 0 || height < 0) {
                    width = height = 500;
                }

                view && this.setViewBox(0, 0, width, height);
                this._renderProductTypeView(this.$._productType, view);
            },

            zoomToPrintAreaFactor: function() {
                var view = this.get('_view');
                var viewMaps = view.$.viewMaps.$items;
                var surroundingRect = this.surroundingRectForViewMaps(viewMaps);
                return 1 + (Math.min(view.get('size.width') / surroundingRect.width, view.get('size.height') / surroundingRect.height) - 1) * this.$.productViewer.$.zoomToPrintArea;
            }.onChange('_view.size.width', '_view.size.height', 'zoomToPrintArea'),

            setViewBox: function(x, y, width, height) {
                this.callBase();
                this.set('viewBoxObj', {
                    x: x,
                    y: y,
                    width: width,
                    height: height
                });
            },

            _commitProduct: function (product) {
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

                    var width = view.get('size.width');
                    var height = view.get('size.height');

                    if (width < 0 || height < 0) {
                        width = height = 500;
                    }

                    view && this.setViewBox(0, 0, width, height);

                    if (!this.$productTypeViewViewerCache[cacheId]) {
                        this.$productTypeViewViewerCache[cacheId] = this.createComponent(ProductTypeViewViewer, {
                            product: this.$.product,
                            productViewer: this,

                            _view: view,
                            _productType: productType,

                            imageService: this.$.imageService
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
            },

            getViewerForConfiguration: function (configuration) {
                if (this.$currentProductTypeViewViewer) {
                    return this.$currentProductTypeViewViewer.getViewerForConfiguration(configuration);
                }
                return null;
            }

        });


    });