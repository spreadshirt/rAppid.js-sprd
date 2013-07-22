define(['sprd/view/svg/ConfigurationRenderer'], function (Renderer) {

    return Renderer.inherit("sprd.view.svg.DesignConfigurationRenderer", {

        defaults: {
            tagName: "image",
            href: "{url()}"
        },

        url: function () {

            if (this.$.imageService && this.$.configuration && this.$.configuration.$.design && this.$.configuration.$.printColors) {
                var options = {
                    width: Math.min(this.$._width, 600),
                    height: Math.min(this.$._height, 600)
                };

                options.printColors =  this.$.configuration.getPrintColorsAsRGB();

                return this.$.imageService.designImage(this.$.configuration.$.design.$.id, options);
            }


            return null;
        }.onChange("design", "_width","_height").on(["configuration.printColors", "reset"])

    })
});