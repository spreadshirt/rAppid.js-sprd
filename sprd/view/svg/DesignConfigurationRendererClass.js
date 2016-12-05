define(['xaml!sprd/view/svg/SpecialFlexConfigurationRenderer'], function (Renderer) {

    return Renderer.inherit("sprd.view.svg.DesignConfigurationRenderer", {

        defaults: {
            tagName: "g",
            maskId: null,
            isSpecialFlex: "{isSpecialFlex()}",
            largeSize: "{largeSize()}",

            filter: "{filter()}"
        },

        url: function () {

            if (this.$.imageService && this.$.configuration && this.$.configuration.$.design && this.$.configuration.$.printColors) {

                var maxSize = Math.min(this.$._width, 600),
                    options = {},
                    design = this.$.configuration.$.design;

                if (this.$.width >= this.$.height) {
                    options.width = maxSize;
                } else {
                    options.height = maxSize;
                }

                options.printColors = this.$.configuration.getPrintColorsAsRGB();
                options.version = design.$.version;

                if (!design.isVectorDesign()) {
                    var processedImage = this.$.configuration.$.processedImage;
                    if (processedImage) {
                        return processedImage.normal;
                    }

                    return design.$.localImage || this.$.imageService.designImage(design.$.wtfMbsId, options);

                } else {
                    return this.$.imageService.designImage(design.$.wtfMbsId, options)
                }

            }
            return null;
        }.onChange("design", "_width", "_height", "configuration.processedImage").on(["configuration.printColors", "reset"]),

        maskUrl: function() {

            if (this.$.imageService && this.$.configuration && this.$.configuration.$.design) {

                var maxSize = Math.min(this.$._width, 600),
                options = {},
                design = this.$.configuration.$.design;

                if (this.$.width >= this.$.height) {
                    options.width = maxSize;
                } else {
                    options.height = maxSize;
                }

                var colors = this.$.configuration.$.printColors.size(),
                    printColors = [];
                for (var i = 0; i < colors; i++) {
                    printColors.push("FFFFFF");
                }

                options.printColors = printColors;
                options.version = design.$.version;

                if (!design.isVectorDesign()) {
                    return design.$.localImage || this.$.imageService.designImage(design.$.wtfMbsId, options);
                } else {
                    return this.$.imageService.designImage(design.$.wtfMbsId, options)
                }

            }


            return null;
        }.onChange("design", "_width", "_height").on(["configuration.printColors", "reset"])


    })
});