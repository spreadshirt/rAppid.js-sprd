define(["sprd/view/ProductImage"], function (ProductImage) {

    return ProductImage.inherit("sprd.view.ProductImage", {
        $classAttributes: ["article"],
        imageUrl: function(){
            var url;
            if(this.$.article){
                url = this.$.article.$.resources[0].href;

                if(this.$.type === ProductImage.TYPE_COMPOSITION){
                    url = url.replace("products","compositions");
                }

                url = this.extendUrlWithSizes(url);

                return url;
            }
            return this.callBase();
        }.onChange('article'),
        alt: function () {
            if (this.$.article) {
                return this.$.article.$.name;
            }

            return "";
        }

    });
});