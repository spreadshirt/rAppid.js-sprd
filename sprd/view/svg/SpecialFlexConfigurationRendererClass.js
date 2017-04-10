define(['sprd/view/svg/ConfigurationRenderer'], function (Renderer) {

    return Renderer.inherit("sprd.view.svg.SpecialFlexConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            maskId: null,
            isSpecialFlex: "{isSpecialFlex()}",
            largeSize: "{largeSize()}",
            filter: "{filter()}"
        },

        ctor: function() {
            this.callBase();
            this.set("maskId", "X" + this.$.configurationViewer.$cid);
        },

        filter: function(){
            var colorId = this.get("configuration.printColors[0].id");
            return colorId == 90 ? "url(#g" + this.$.maskId + ")" : "";
        }.on(["configuration.printColors", "reset"]),

        isSpecialFlex: function() {
            return this.get("configuration.printType.id") == 16;
        }.onChange("configuration.printType"),

        largeSize: function() {
            return this.$.width >= this.$.height ? this.$.width : this.$.height;
        }.onChange("width", "height"),

        patternUrl: function() {

            var colorId = this.get("configuration.printColors[0].id");

            if (colorId == null || !this.isSpecialFlex()) {
                return;
            }

            return this.baseUrl("sprd/img/specialFlex/" + this.PARAMETER().platform + "-" + colorId + ".jpg");

        }.on(["configuration.printColors", "reset"]),

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