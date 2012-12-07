define(['js/svg/SvgElement', "sprd/data/ImageService"], function (SvgElement, ImageService) {

    return SvgElement.inherit('sprd/view/svg/ProductTypeViewViewer', {

        defaults: {
            tagName: "g",
//            componentClass: "product-type-view",

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
//
//            var border = this.createComponent(SvgElement, {
//                tagName: "rect",
//                class: "print-area-border",
//                width: this.get('printArea.boundary.size.width'),
//                height: this.get('printArea.boundary.size.height')
//            });
//
//            this.addChild(border);
        }

    });
});