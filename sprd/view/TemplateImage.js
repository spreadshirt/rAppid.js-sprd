define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function(Image, ImageService) {

    return Image.inherit("sprd.view.TemplateImage", {

        defaults: {

            /***
             * the template to show
             *
             * @type {sprd.model.Template}
             * @required
             */
            template: null,
            templateId: null
        },

        inject: {
            imageService: ImageService
        },

        imageUrl: function() {
            var template = this.$.template,
                id = this.$.templateId;

            if (!template && !id) {
                return null;
            }
            else if (template) {
                this.set('templateId', template.$.id);
                id = template.$.id;
            }

            return this.$.imageService.productImage(id, 0, null, "composition", {
                width: this.$.width,
                height: this.$.height,
                hideProductType: true
            });

        }.onChange('template', 'width', 'height')
    });
});