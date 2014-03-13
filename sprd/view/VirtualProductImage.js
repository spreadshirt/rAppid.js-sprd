define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function (Image, ImageService) {

    return Image.inherit("sprd.view.VirtualProductImage", {

        defaults: {
            virtualProduct: null,

            viewId: null
        },

        inject: {
            imageService: ImageService
        },

        imageUrl: function () {
            var imageService = this.$.imageService,
                vpString = this.get("virtualProduct.vpString"),
                viewId = this.$.viewId;

            if (vpString && viewId) {
                return imageService.virtualProductImage(this.$.virtualProduct.$.originalProduct, vpString, viewId, {
                    width: this.$.width,
                    height: this.$.height
                });
            }

        }.onChange("virtualProduct.vpString", "viewId")

    });
});