define(['sprd/view/svg/ConfigurationRenderer', 'sprd/config/RealisticFlexColors', 'js/type/Color'], function(Renderer, RealisticFlexColors, Color) {

    return Renderer.inherit("sprd.view.svg.PatternRendererClass", {

        defaults: {
            tagName: "g",
            maskId: null,
            isSpecialFlex: "{isSpecialFlex()}",
            isFlock: "{isFlock()}",
            largeSize: "{largeSize()}",
            filter: "{filter()}"
        },

        ctor: function() {
            this.callBase();
            this.set("maskId", "X" + this.$.configurationViewer.$cid);
        },

        filter: function() {
            var colorId = this.get("configuration.printColors[0].id");
            return colorId == 90 ? "url(#g" + this.$.maskId + ")" : "";
        }.on(["configuration.printColors", "reset"]),

        isSpecialColor: function(layerIndex) {
            return this.isSpecialFlex() || this.isFlock() || this.isRealisticFlexColor(layerIndex);
        }.onChange("configuration.printType").on(["configuration.printColors", "reset"]),

        isSpecialFlex: function() {
            return this.get("configuration.printType.id") == 16;
        }.onChange("configuration.printType"),

        isFlock: function() {
            return this.get("configuration.printType.id") == 2;
        }.onChange("configuration.printType"),

        isRealisticFlexColor: function(layerIndex) {
            layerIndex = layerIndex || 0;

            var colorId = this.get("configuration.printColors["+ layerIndex + "].id") || null;
            return this.get("configuration.printType.id") == 14 && (colorId in RealisticFlexColors[this.PARAMETER().platform]);
        }.onChange("configuration.printType"),

        hasSpecialColor: function() {
            var printColors = this.get("configuration.printColors");

            for (var layerIndex = 0; layerIndex < printColors.length; layerIndex++) {
                if (this.isSpecialColor(layerIndex)) {
                    return true
                }
            }

            return false;
        }.onChange("configuration.printType").on(["configuration.printColors", "reset"]),

        largeSize: function() {
            return this.$.width >= this.$.height ? this.$.width : this.$.height;
        }.onChange("width", "height"),

        patternUrl: function(layerIndex) {

            layerIndex = layerIndex || 0;
            var colorId = this.get("configuration.printColors[" + layerIndex + "].id");

            if (colorId == null) {
                return;
            }

            if (this.isSpecialFlex()) {
                return this.baseUrl("sprd/img/specialFlex/" + this.PARAMETER().platform + "-" + colorId + ".jpg");
            }

            if (this.isFlock()) {
                return this.baseUrl("sprd/img/flock/" + colorId + ".jpg");
            }

            if (this.isRealisticFlexColor(layerIndex)) {
                return this.baseUrl("sprd/img/realisticFlexColors/" + colorId + ".jpg");
            }

        }.on(["configuration.printColors", "reset"]),

        maskUrl: function(layer) {

            if (this.$.imageService && this.$.configuration && this.$.configuration.$.design) {
                var colors = this.$.configuration.$.printColors;
                var layerColor = colors[layer];

                if (!layerColor) {
                    return null;
                }

                var maxSize = Math.min(this.$._width, 600),
                    options = {},
                    design = this.$.configuration.$.design;

                if (this.$.width >= this.$.height) {
                    options.width = maxSize;
                } else {
                    options.height = maxSize;
                }

                var printColors = [];
                for (var i = 0; i < colors; i++) {
                    printColors.push("none");
                }

                printColors[layer] = "FFFFFF";

                options.printColors = printColors;
                options.version = design.$.version;

                if (!design.isVectorDesign()) {
                    return design.$.localImage || this.$.imageService.designImage(design.$.wtfMbsId, options);
                } else {
                    return this.$.imageService.designImage(design.$.wtfMbsId, options)
                }

            }

            return null;
        }.onChange("design", "_width", "_height").on(["configuration.printColors", "reset"]),

        getPrintColor: function() {
            var configuration = this.$.configuration,
                printColors = configuration.$.printColors,
                printColor = null;

            if (printColors && printColors.size() && !this.isSpecialFlex() && !this.isFlock() && !this.isRealisticFlexColor()) {
                printColor = printColors.at(0).toHexString();
            }

            return printColor;
        }.on(["configuration.printColors", "reset"]).onChange("configuration.printType"),

        getFill: function() {
            var maskId = this.$.maskId;
            if (this.isSpecialColor()) {
                return "fill: url(#p" + maskId + "-0);";
            }
        }.onChange('maskId').on("getPrintColor()", "isSpecialColor()")

    })
});