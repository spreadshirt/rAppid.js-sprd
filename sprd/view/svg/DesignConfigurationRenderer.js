define(['sprd/view/svg/ConfigurationRenderer'], function (Renderer) {

    return Renderer.inherit("sprd.view.svg.DesignConfigurationRenderer", {

        defaults: {
            tagName: "image",
            href: "{url()}"
        },

        url: function () {

            if (this.$.imageService && this.$.configuration && this.$.configuration.$.design && this.$.configuration.$.printColors) {

                var maxSize = Math.min(this.$._width, 600),
                    options = {};

                if (this.$.width >= this.$.height) {
                    options.width = maxSize;
                } else {
                    options.height = maxSize;
                }

                options.printColors = this.$.configuration.getPrintColorsAsRGB();

                return this.$.imageService.designImage(this.$.configuration.$.design.$.wtfMbsId, options);
            }


            return null;
        }.onChange("design", "_width", "_height").on(["configuration.printColors", "reset"])

    })
});