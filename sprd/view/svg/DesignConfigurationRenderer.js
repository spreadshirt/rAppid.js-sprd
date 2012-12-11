define(['sprd/view/svg/ConfigurationRenderer', "sprd/data/ImageService"], function (Renderer, ImageService) {

    return Renderer.inherit("sprd.view.svg.DesignConfigurationRenderer", {

        defaults: {
            tagName: "image",
            href: "{url()}"
        },

        inject: {
            imageService: ImageService
        },

        url: function () {
            if (this.$.imageService && this.$.configuration && this.$.configuration.$.design) {
                return this.$.imageService.designImage(this.$.configuration.$.design.$.id, {
                    width: this.$._width,
                    height: this.$._height
                });
            }

            return null;
        }.onChange("design")

    })
});