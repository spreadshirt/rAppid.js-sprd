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
            this.$configurations = [];
            this.$views = {};

            this.callBase();
        },

        initialize: function(){
            this.bind('product','change:productType', this._onProductTypeChange,this);
            this.bind('product','change:appearance', this._onAppearanceChange, this);

            this.bind('product.configurations', 'add', this._onConfigurationAdd, this);

            this.callBase();
        },
        _onConfigurationAdd: function (e) {
            this._renderConfigurations(e.$);
        },
        _onProductTypeChange: function(e){
            // check if new productType has same appearance as set
            var appearance = null;
            if(e.$ && this.$.product.$.appearance){
                appearance = e.$.getAppearanceById(this.$.product.$.appearance.id);
            }
            // if so, set this as appearance, else use null
            this.set('_appearance', appearance, {silent: true});
            this.set('_productType', e.$);
        },
        _onAppearanceChange: function(e){
            this.set('_appearance', e.$);
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

            var view = this.$.view;
            if(view){
                view = productType.getViewByPerspective(view.$.perspective);
                if(!view){
                    view = productType.getDefaultView();
                }

                if(this.$.view === view){
                    this._renderView(view);
                }else{
                    this.set('view', view);
                }
            }
        },

        _renderConfigurations: function() {

             var i;

            for (i = 0; i < this.$configurations.length; i++) {
                this.$configurations[i].remove();
            }

            this.$configurations = [];

            if (this.$.product) {
                for (i = 0; i < this.$.product.$.configurations.size(); i++) {
                    this._renderConfiguration(this.$.product.$.configurations.at(i));
                }
            }
        },

        _renderConfiguration: function(config) {
            if (config && this.$.view && this.$._productType) {
                if (config.printArea && this.$printAreas.hasOwnProperty(config.printArea.id)) {

                    var svg = config.render(this.$paper);

                    if (svg) {
                        // add it to print area
                        var printArea = this.$printAreas[config.printArea.id];
                        var matrix = printArea.matrix.clone();
                        matrix.translate(config.get('offset.x'), config.get('offset.y'));
                        matrix.rotate(config.get('rotation'), 0, 0);

                        svg.transform(matrix.toTransformString());

                        this.$configurations.push(svg);
                    }

                }
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
            for (var key in this.$printAreas) {
                if (this.$printAreas.hasOwnProperty(key)) {
                    this.$printAreas[key].remove();
                }
            }

            this.$printAreas = {};

            if (view && this.$._productType) {
                // create print areas
                for (var i = 0; i < view.$.viewMaps.length; i++) {
                    var viewMap = view.$.viewMaps[i];
                    var printArea = this.$._productType.getPrintAreaById(viewMap.printArea.id);

                    if (printArea && !this.$printAreas[printArea.id]) {

                        var rect = this.$paper.rect(0, 0, printArea.boundary.size.width, printArea.boundary.size.height);
                        rect.translate(viewMap.offset.x, viewMap.offset.y);

                        // create print area and save
                        this.$printAreas[printArea.id] = rect;

                        if (viewMap.transformations) {

                            var matches = viewMap.transformations.operations.match(/^rotate\(((?:[\-0-9]*\s?)*)\)$/);
                            if (matches && matches.length > 0) {
                                var par = matches[1].split(" ");
                                rect.transform("r" + [par[0],viewMap.offset.x, viewMap.offset.y].join(","));
                            }
                        }
                    }
                }

                this._renderConfigurations();
            }

        },
        _getTransformString: function(){

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
        },
        destroy: function(){
            this.unbind('product', 'change:productType', this._onProductTypeChange, this);
            this.unbind('product', 'change:appearance', this._onAppearanceChange, this);
            this.unbind('product.configurations', 'add', this._onConfigurationAdd, this);

            this.callBase();
        }

    });


});