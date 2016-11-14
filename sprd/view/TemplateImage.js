define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function(Image, ImageService) {

    return Image.inherit("sprd.view.TemplateImage", {

        defaults: {

            /***
             * the template to show
             *
             * @type {sprd.model.Template}
             * @required
             */
            template: null
        },

        inject: {
            imageService: ImageService
        },

        imageUrl: function() {
            var template = this.$.template;
            if (!template) {
                return null;
            }

            return this.$.imageService.productImage(template.$.id, 0, null, "composition", {
                width: this.$.width,
                height: this.$.height,
                hideProductType: true
            });
        }.onChange('template', 'width', 'height')
    });
});