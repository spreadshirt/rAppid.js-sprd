define(['sprd/view/svg/ConfigurationRenderer'], function (Renderer) {

    return Renderer.inherit("sprd.view.svg.DesignConfigurationRenderer", {

        defaults: {
            tagName: "image",
            href: "{url()}"
        },

        url: function () {

            if (this.$.imageService && this.$.configuration && this.$.configuration.$.design && this.$.configuration.$.printColors) {
                var options = {
                    width: this.$._width,
                    height: this.$._height
                };

                options.printColors =  this.$.configuration.getPrintColorsAsRGB();

                return this.$.imageService.designImage(this.$.configuration.$.design.$.id, options);
            }


            return null;
        }.onChange("design").on(["configuration.printColors", "reset"])

    })
});