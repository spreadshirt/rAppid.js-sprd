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

                view && this.setViewBox(0, 0, view.get('size.width'), view.get('size.height'));

                this._renderProductTypeView(this.$._productType, view);
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
            },

            getViewerForConfiguration: function(configuration){
                if(this.$currentProductTypeViewViewer){
                    return this.$currentProductTypeViewViewer.getViewerForConfiguration(configuration);
                }
                return null;
            }

        });


    });