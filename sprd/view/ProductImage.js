define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function (Image, ImageService) {

    var PRODUCT = "product",
        COMPOSITION = "composition";

    var ProductImage = Image.inherit({

        defaults: {
            // if null use default view
            view: null,
            type: PRODUCT
        },

        inject: {
            imageService: ImageService
        },

        _commitChangedAttributes: function(attributes){
            this.callBase();
            if(attributes.hasOwnProperty('product') || attributes.hasOwnProperty('type') || attributes.hasOwnProperty('appearance') || attributes.hasOwnProperty('view')){
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
                url += '/views/' +  (this.$.view ? this.$.view.$.id : "1");

                url = this.extendUrlWithSizes(url);

                if(this.$.appearance) {
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