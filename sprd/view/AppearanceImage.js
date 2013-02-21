define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function (Image, ImageService) {


    return Image.inherit('sprd.view.AppearanceImage', {

        defaults: {
            appearance: null
        },

        inject: {
            imageService: ImageService
        },

        _commitChangedAttributes: function (attributes) {
            this.callBase();
            if (attributes.hasOwnProperty('appearance')) {
                this.set('loaded', false);
            }
        },

        imageUrl: function () {
            var url = null,
                imageService = this.$.imageService,
                appearance = this.$.appearance;

            if (appearance && imageService) {
                return imageService.appearanceImage(this.$.appearance.$.id, {
                    width: this.$.width,
                    height: this.$.height
                });
            }
            return url;

        }.onChange('appearance')
    });
});