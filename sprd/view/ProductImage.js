define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function (Image, ImageService) {

    var viewIdExtractor = /\/views\/(\d+)/;

    return Image.inherit("sprd.view.ProductImage", {

        defaults: {
            /***
             * the view of the corresponding product type. If the view isn't set
             * the default view will be used.
             */
            view: null,

            /***
             * the product to show
             *
             * @type {sprd.model.Product}
             * @required
             */
            product: null,

            /***
             * the appearance of the corresponding product type. If the appearance isn't
             * set the default appearance of the product is used.
             */
            appearance: null,

            type: ImageService.ProductImageType.PRODUCT,

            mediaType: null
        },

        inject: {
            imageService: ImageService
        },

        _commitChangedAttributes: function (attributes) {
            this.callBase();
            if (attributes.hasOwnProperty('product') || attributes.hasOwnProperty('type') || attributes.hasOwnProperty('appearance') || attributes.hasOwnProperty('view')) {
                this.set('loaded', false);
            }
        },

        imageUrl: function () {
            if (this.$.product) {
                var product = this.$.product,
                    viewId = this.get('view.id') || product.getDefaultViewId(),
                    resources = product.$.resources;

                if (!viewId && resources instanceof Array) {
                    // get view id from resource -> this is a hack, because image server
                    // can't generate an image without the view id -> should be implemented by image server

                    for (var i = 0; i < resources.length; i++) {
                        viewId = viewIdExtractor.exec(resources[i].href);
                        if (viewId) {
                            viewId = viewId[1];
                            break;
                        }
                    }
                }

                viewId = viewId || 0;

                return this.$.imageService.productImage(product.$.id, viewId, this.get("appearance.id"), this.$.type, {
                    width: this.$.width,
                    height: this.$.height,
                    mediaType: this.$.mediaType
                });
            }
            return null;

        }.onChange('product', 'width', 'height', 'type', 'view', 'appearance')

    });
});