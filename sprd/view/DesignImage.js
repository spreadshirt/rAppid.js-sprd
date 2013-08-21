define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function (Image, ImageService) {

    return Image.inherit('sprd.view.DesignImage',{

        defaults: {
            design: null,
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
            var url = null,
                imageService = this.$.imageService,
                design = this.$.design;

            if (design && imageService && (this.$.height || this.$.width)) {
                return imageService.designImage(this.$.design.$.id, {
                    width: !this.$.width ? this.$.height : this.$.width,
                    height: !this.$.height ? this.$.width : this.$.height
                });
            }
            return url;

        }.onChange('design', 'height', 'width')
    });
});