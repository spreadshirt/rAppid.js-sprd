define(["sprd/view/ProductImage", "sprd/data/ImageService"], function (ProductImage, ImageService) {

    return ProductImage.inherit("sprd.view.ArticleImage", {

        _commitChangedAttributes: function (attributes) {
            this.callBase();
            if (attributes.hasOwnProperty('article')) {
                this.set('loaded', false);
            }
        },

        imageUrl: function () {
            var url;
            if (this.$.article && this.$.article.$.resources && this.$.article.$.resources.length) {
                url = this.$.article.$.resources[0].href;

                var id = this.$.article.$.id;
                id = Math.floor(parseInt(id.substr(id.length - 2)) / 5);
                url = url.replace(/:\/\/image/, '://image' + id);

                if (this.$.type === ImageService.ProductImageType.COMPOSITION) {
                    url = url.replace("products", "compositions");
                }

                url = this.extendUrlWithSizes(url);

                var mediaType = this.$.mediaType;
                if (mediaType) {
                    url += "." + mediaType;
                }

                return url;
            }

            return this.callBase();
        }.onChange("article").on(["article", "change:resources"]),

        alt: function () {
            return this.get("article.name");
        }

    });
});