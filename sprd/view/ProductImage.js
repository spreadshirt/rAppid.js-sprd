define(["xaml!sprd/view/Image"], function (Image) {

    var PRODUCT = "product",
        COMPOSITION = "composition";

    return Image.inherit({

        $classAttributes: ["view", "type", "product"],

        defaults: {
            // if null use default view
            view: null,
            type: PRODUCT
        },

        imageUrl: function () {

            var url = "";

            if (this.$.product) {
                var product = this.$.product;

                if (this.$.type != COMPOSITION) {
                    // use product
                    url = "http://image.spreadshirt.net/image-server/v1/products/" + product.$.id;
                } else {
                    url = "http://image.spreadshirt.net/image-server/v1/compositions/" + product.$.id;
                }
                url += '/views/' +  (this.$.view ? this.$.view.id : "1");

                if (this.$.width) {
                    url += "/width/" + this.normalizeSize(this.$.width);
                }

                if (this.$.height) {
                    url += "/height/" + this.normalizeSize(this.$.height);
                }
            }

            return url;

        }.onChange('product', 'width', 'height', 'type', 'view')

    });
});