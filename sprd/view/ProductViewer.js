define(['js/ui/View','sprd/model/Product', 'Raphael', 'underscore', 'sprd/data/ImageService'], function(View, Product, Raphael, _, ImageService){

    return View.inherit('sprd.view.ProductViewer',{
        $classAttributes: ['productType','product','appearance'],
        defaults: {
            height: 300,
            width: 300,
            view: null,

            product: null,

            // private defaults
            _productType: null,
            _appearance: null,

            componentClass: 'product-viewer'
        },

        inject: {
            imageService: ImageService
        },

        ctor: function () {
            this.$printAreas = {};
            this.$views = {};

            this.callBase();
        },

        initialize: function(){
            var self = this;
            this.bind('product','change:productType', function (e) {
                self.set('_appearance', null, {
                    silent: true
                });
                self.set('_productType', e.$);
            });

            this.bind('product','change:appearance', function (e) {
                self.set('_appearance', e.$);
            });

            this.bind('product.configurations', 'add', function (e) {
                self._renderConfigurations();
            });

            this.callBase();
        },


        _initializeRenderer: function(el) {
            this.callBase();
            this.$paper = Raphael(el, 10, 10);
        },

        _renderProduct: function(product, oldProduct) {
            // product changed
            if (this.$paper) {
                this.$paper.clear();
            }

            var self = this;

            if (oldProduct) {
                // TODO: unbind old product events
            }

            this.set("_productType", product ? product.$.productType : null);
        },

        _render_productType: function(productType) {
            this._removeViewsFromPaper();
            this.$views = {};

            this._renderView(this.$.view);

        },

        _renderConfigurations: function() {
            if (this.$.view && this.$._productType) {

            }
        },

        _removeViewsFromPaper: function() {
            if (this.$currentProductTypeView) {
                this.$currentProductTypeView.remove();
            }
        },

        _renderView: function(view) {
            this._renderProductTypeViewAppearance();

            // clear print areas
            for (var printAreaId in this.$printAreas) {
                if (this.$printAreas.hasOwnProperty(printAreaId)) {
                    this.$printAreas[printAreaId].remove();
                }
            }

            if (view && this.$._productType) {
                // create print areas
                for (var i = 0; i < view.$.viewMaps.length; i++) {
                    var viewMap = view.$.viewMaps[i];
                    var printArea = this.$._productType.getPrintAreaById(viewMap.printArea.id);

                    if (printArea) {
                        // create print area and save
                        this.$printAreas[viewMap.printArea.id] = this.$paper.rect(viewMap.offset.x, viewMap.offset.y, printArea.boundary.size.width, printArea.boundary.size.height);
                    }
                }

                this._renderConfigurations();
            }

        },

        _render_appearance: function() {
           this._renderProductTypeViewAppearance();
        },

        _renderProductTypeViewAppearance: function() {
            this._removeViewsFromPaper();

            var view = this.$.view,
                appearance = this.$._appearance,
                productType = this.$._productType;

            if (view && appearance && productType) {
                this.$paper.setViewBox(0, 0, view.get('size.width'), view.get('size.height'));

                var url = this.$.imageService.productTypeImage(productType.$.id, view.$.id, appearance.id, {
                    width: this.$.width,
                    height: this.$.height
                });

                this.$currentProductTypeView = this.$paper.image(url, 0, 0, view.get('size.width'), view.get('size.height'));
                this.$currentProductTypeView.toBack();
            }

        },

        _renderWidth: function(width) {
            this.setSize();
        },

        _renderHeight: function(height) {
            this.setSize();
        },

        setSize: function() {
            this.$paper.setSize(this.$.width, this.$.height);
        }

    });


});