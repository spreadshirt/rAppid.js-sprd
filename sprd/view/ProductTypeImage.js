define([
    'xaml!sprd/view/Image'
], function (Image) {

    return Image.inherit('app.view.ProductTypeImage', {

        defaults: {
            type: "preview",
            productType: null,

            appearance: null,
            view: null
        },

        imageUrl: function () {
            if (this.$.productType && this.$.productType.$.resources) {
                var url;
                if (this.$.type === "preview") {
                    url = this.$.productType.$.resources[0].href;
                } else if (this.$.type === "size") {
                    url = this.$.productType.$.resources[1].href;
                }
                return this.extendUrlWithSizes(url);
            }
            return "";
        }.onChange('width', 'height', 'productType'),

        alt: function () {
            if (this.$.productType) {
                return this.$.productType.$.name;
            }
            return null;
        }

    });

});