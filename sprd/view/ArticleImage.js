define(["sprd/view/ProductImage"], function (ProductImage) {

    return ProductImage.inherit("sprd.view.ProductImage", {

        $classAttributes: ["article"],

        _commitChangedAttributes: function (attributes) {

            if (attributes && attributes.article) {
                var self = this;
                attributes.article.product(function (err, product) {
                    self.set('product', product);
                });
            }

            this.callBase();
        },

        alt: function () {
            if (this.$.article) {
                return this.$.article.$.name;
            }

            return "";
        }

    });
});