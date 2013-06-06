define(['js/svg/SvgElement', "sprd/data/ImageService", "xaml!sprd/view/svg/PrintAreaViewer"], function (SvgElement, ImageService, PrintAreaViewer) {

    return SvgElement.inherit('sprd.view.svg.ProductTypeViewViewer', {

        defaults: {
            tagName: "g",
            componentClass: "product-type-view",

            product: null,

            productViewer: null,

            _width: "{productViewer.width}",
            _height: "{productViewer.height}",
            _appearance: "{product.appearance}",

            _view: null,
            _productType: null
        },

        $classAttributes: ["productViewer", "product"],

        inject: {
            imageService: ImageService
        },

        ctor: function () {
            this.$printAreas = [];

            this.callBase();
        },

        url: function () {
            if (this.$.imageService && this.$._productType && this.$._view && this.$._productType.containsAppearance(this.$._appearance)) {
                return this.$.imageService.productTypeImage(this.$._productType.$.id, this.$._view.$.id, this.$._appearance.$.id, {
                    width: this.$._width,
                    height: this.$._height
                });
            }

            return "";
        }.onChange("_width", "_height", "_appearance"),

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

        _render_view: function (view) {

            this._removePrintAreas();

            if (view) {

                for (var i = 0; i < view.$.viewMaps.$items.length; i++) {
                    var viewMap = view.$.viewMaps.$items[i];

                    var printAreaViewer = this.createComponent(PrintAreaViewer, {
                        product: this.$.product,
                        productTypeViewViewer: this,
                        productViewer: this.$.productViewer,

                        _viewMap: viewMap
                    });

                    this.addChild(printAreaViewer);
                    this.$printAreas.push(printAreaViewer);

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