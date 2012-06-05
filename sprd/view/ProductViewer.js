define(['js/ui/View','sprd/model/Product', 'Raphael', 'underscore', 'sprd/data/ImageService', 'sprd/view/svg/ConfigurationViewer', 'sprd/view/svg/PrintAreaViewer'],
    function(View, Product, Raphael, _, ImageService, ConfigurationViewer, PrintAreaViewer){

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
            this.$renderedConfigurations = {};
            this.$configurationViewer = {};

            this.callBase();
        },

        initialize: function(){

            this.bind('product','change:productType', this._onProductTypeChange, this);
            this.bind('product','change:appearance', this._onAppearanceChange, this);

            this.bind('product.configurations', 'add', this._onConfigurationAdded, this);
            this.bind('product.configurations', 'remove', this._onConfigurationRemoved, this);
//            this.bind('product.configurations', 'change:printArea', this._onConfigurationChange, this);

            this.callBase();
        },

        _removeConfiguration: function(configuration) {

            if (configuration) {
                var configurationViewer = this.$configurationViewer[configuration.$cid];

                if (configurationViewer) {
                    configurationViewer.dispose();
                }

                delete this.$configurationViewer[configuration.$cid];
            }

        },

        _onConfigurationAdded: function (e) {

            // create a new configuration viewer for the configuration
            var configuration = e.$.item;
            // add configuration viewer
            this.$configurationViewer[configuration.$cid] = new ConfigurationViewer(configuration);

            this._renderConfiguration(configuration);

        },

        _onConfigurationRemoved: function (e) {
            this._removeConfiguration(e.$);
        },


        _onConfigurationChange: function(e) {
            this._renderConfiguration(e.$.item);
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

            if (oldProduct instanceof Object) {
                // TODO: mkre, this is the first time string -> {product} -> should be null, because there isn't a previous attribute
                for (var i = 0; i < oldProduct.get('configurations').length; i++) {
                    this._removeConfiguration(oldProduct.get('configurations[' + i + ']'));
                }
            }

            this.set("_productType", this.get(product, "productType"));
        },

        _render_productType: function(productType) {
            this._removeViewsFromPaper();

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


            for (var key in this.$configurationViewer) {
                if (this.$configurationViewer.hasOwnProperty(key)) {
                    this.$configurationViewer.render(this.$paper);
                }
            }

             var i;

            for (i = 0; i < this.$renderedConfigurations.length; i++) {
                this.$renderedConfigurations[i].remove();
            }

            this.$renderedConfigurations = [];

            if (this.$.product) {
                for (i = 0; i < this.$.product.$.configurations.size(); i++) {
                    this._renderConfiguration(this.$.product.$.configurations.at(i));
                }
            }
        },

        _renderConfiguration: function(config) {
            if (config) {
                var configurationViewer = this.$configurationViewer[config.$cid],
                    showViewer = false;

                if (this.$.view && this.$._productType) {

                    var printAreaId = config.get('printArea.id'),
                        printAreaViewer = this.$printAreas[printAreaId];

                    if (printAreaViewer) {
                        // print area rendered

                        configurationViewer.$printAreaViewer = printAreaViewer;

                        // activate the configuration viewer
                        configurationViewer.render(this.$paper);

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
                    this.$printAreas[key].destroy();
                }
            }

            this.$printAreas = {};

            var _productType = this.get('_productType');
            if (view && _productType) {
                // create print areas
                for (var i = 0; i < view.$.viewMaps.length; i++) {
                    var viewMap = view.$.viewMaps[i];
                    var printArea = _productType.getPrintAreaById(viewMap.printArea.id);

                    if (printArea && !this.$printAreas[printArea.id]) {

                        // create a print area viewer
                        var printAreaViewer = new PrintAreaViewer(printArea, viewMap);
                        printAreaViewer.render(this.$paper);

                        // and save
                        this.$printAreas[printArea.id] = printAreaViewer;

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
            this.unbind('product.configurations', 'add', this._onConfigurationAdded, this);

            this.callBase();
        }

    });


});