define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function (Image, ImageService) {

    var PRODUCT = "product",
        COMPOSITION = "composition",
        viewIdExtractor = /\/views\/(\d+)/;

    var ProductImage = Image.inherit("sprd.view.ProductImage", {

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

            type: PRODUCT
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
            var url = null;
            var imageService = this.$.imageService;

            if (this.$.product) {
                var product = this.$.product;

                if (this.$.type != COMPOSITION) {
                    // use product
                    url = imageService.$.endPoint + "/products/" + product.$.id;
                } else {
                    url = imageService.$.endPoint + "/compositions/" + product.$.id;
                }

                var viewId = this.$.view ? this.$.view.$.id : product.getDefaultViewId();

                var resources = product.$.resources;

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

                url += '/views/' + viewId;

                url = this.extendUrlWithSizes(url);

                if (this.$.appearance) {
                    url += ",appearanceId=" + this.$.appearance.$.id;
                }

                return url;
            }
            return url;

        }.onChange('product', 'width', 'height', 'type', 'view', 'appearance')

    });

    ProductImage.TYPE_COMPOSITION = COMPOSITION;
    ProductImage.TYPE_PRODUCT = PRODUCT;

    return ProductImage;
});