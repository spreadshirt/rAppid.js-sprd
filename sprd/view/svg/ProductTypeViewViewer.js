define(['js/svg/SvgElement', "sprd/data/ImageService", "sprd/view/svg/PrintAreaViewer"], function (SvgElement, ImageService, PrintAreaViewer) {

    return SvgElement.inherit('sprd/view/svg/ProductTypeViewViewer', {

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

        ctor: function() {
            this.$printAreas = [];

            this.callBase();
        },

        url: function () {
            if (this.$.imageService && this.$._productType && this.$._view && this.$._productType.containsAppearance(this.$._appearance) ) {
                return this.$.imageService.productTypeImage(this.$._productType.$.id, this.$._view.$.id, this.$._appearance.$.id, {
                    width: this.$._width,
                    height: this.$._height
                });
            }

            return "";
        }.onChange("_width", "_height", "_appearance"),

        _initializeRenderer: function () {

            this.$productTypeImage = this.createComponent(SvgElement, {
                tagName: "image",
                href: "{url()}",
                x: 0,
                y: 0,
                width: "{_view.size.width}",
                height: "{_view.size.height}"
            });

            this.addChild(this.$productTypeImage);

            this.callBase();

        },

        _removePrintAreas: function() {
            for (var i = 0; i < this.$printAreas.length; i++) {
                var printArea = this.$printAreas[i];
                printArea.remove();
                printArea.destroy();
            }

            this.$printAreas = [];
        },

        _render_view: function(view) {

            this._removePrintAreas();

            if (view) {

                for (var i = 0; i < view.$.viewMaps.$items.length; i++) {
                    var viewMap = view.$.viewMaps.$items[i];

                    var printAreaViewer = this.createComponent(PrintAreaViewer, {
                        product: this.$.product,
                        productTypeViewViewer: this,

                        _viewMap: viewMap
                    });

                    this.addChild(printAreaViewer);
                    this.$printAreas.push(printAreaViewer);

                }

            }
        },

        destroy: function() {

            this._removePrintAreas();
            this.callBase();
        }

    });
});