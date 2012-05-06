define(["sprd/data/SprdModel", "sprd/model/Product", "sprd/model/Currency"], function (SprdModel, Product, Currency) {

    var rProductIdExtractor = /^http.*products\/(\d+).*$/;

    return SprdModel.inherit("sprd.data.Article",{
        price: function() {
            var currency = this.$context.$parent.createModel(Currency, this.$.price.currency.$.id, "Currency");
            return currency.formatPrice(this.$.price.vatIncluded);
        },

        product: function(callback) {

            var cb = function(err, article) {
                if (callback) {
                    callback(err, article);
                }
            };

            var productId;

            if (this.$.product) {
                cb(null, this.$.product);
            } else if (this.$.resources) {

                for (var i = 0; i < this.$.resources.length; i++) {
                    var resource = this.$.resources[i];

                    var match = rProductIdExtractor.exec(resource.href);
                    if (match) {
                        productId = match[1];
                        break;
                    }
                }
            }

            if (productId) {
                // create a product in correct context
                cb(null, this.$context.createModel(Product, productId));
            } else {
                this.fetch(null, function(err, article) {
                    cb(err, article ? article.$.product : null);
                });
            }
        }
    });
});
