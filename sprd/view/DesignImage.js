define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function (Image, ImageService) {

    return Image.inherit('sprd.view.DesignImage',{

        defaults: {
            // if null use default view
            view: null
        },

        inject: {
            imageService: ImageService
        },

        _commitChangedAttributes: function (attributes) {
            this.callBase();
            if (attributes.hasOwnProperty('design')) {
                this.set('loaded', false);
            }
        },

        imageUrl: function () {
            var url = null;
            var imageService = this.$.imageService;

            if (this.$.design) {
                var design = this.$.design;

                url = imageService.$.endPoint + "/designs/" + design.$.id;

                url = this.extendUrlWithSizes(url);

                return url;
            }
            return url;

        }.onChange('design')
    });
});