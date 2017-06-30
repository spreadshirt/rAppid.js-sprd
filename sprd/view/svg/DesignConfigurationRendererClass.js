define(['xaml!sprd/view/svg/PatternRenderer'], function(PatternRenderer) {

    return PatternRenderer.inherit("sprd.view.svg.DesignConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            maskId: null,
            "data-mask-id": "{configuration.afterEffect.id}",
            isSpecialFlex: "{isSpecialFlex()}",
            isFlock: "{isFlock()}",
            largeSize: "{largeSize()}",
            filter: "{filter()}",
            loadedLayers: {},
            viewer: null,
            loading: "{configuration.loading}",
            allLayersLoaded: "{allLayersLoaded()}"
        },

        $classAttributes: ["x", "y", "width", "height", "loadedLayers"],

        url: function() {

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
                    return this.$.configuration.$.processedImage || design.$.localImage || this.$.imageService.designImageFromCache(design.$.wtfMbsId, options);
                }

            }
            return null;
        }.onChange("design", "_width", "_height", "configuration.processedImage").on(["configuration.printColors", "reset"]),

        maskUrl: function(layerIndex) {

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
                    printColors.push("none");
                }

                printColors[layerIndex] = "FFFFFF";

                options.printColors = printColors;
                options.version = design.$.version;
                options.layerIndex = layerIndex;

                if (!design.isVectorDesign()) {
                    return this.$.configuration.$.processedImage || design.$.localImage || this.$.imageService.designImageFromCache(design.$.wtfMbsId, options);
                } else {
                    return this.$.imageService.designImageFromCache(design.$.wtfMbsId, options);
                }

            }

            return null;
        }.onChange("design", "_width", "_height").on(["configuration.printColors", "reset"]),

        handleLoad: function(index) {
            var loadedLayers = this.get("loadedLayers") || {};
            loadedLayers[index] = true;
            this.set("loadedLayers", loadedLayers, {update: true, force: true});
        },

        allLayersLoaded: function() {
            var loadedLayers = this.get("loadedLayers");
            var length = Object.keys(loadedLayers).length;

            return length == this.get("configuration.printColors.length");
        }.onChange("loadedLayers").on(["configuration.printColors", "reset"]),

        fillUrl: function(layerIndex) {
            //there are some designs where the layer order needs to be switched
            var fixedLayerIndex = this.get("configuration.design.colors.$items")[layerIndex].$.layer;

            if (this.isSpecialColor(fixedLayerIndex)) {
                return "url(#p" + this.$.maskId + "-" + fixedLayerIndex + ")";
            }

            var printColors = this.get("configuration.printColors.$items");
            return printColors[fixedLayerIndex].color().toString();
        },

        fillColor: function(layerIndex) {
            var fixedLayerIndex = this.get("configuration.design.colors.$items")[layerIndex].$.layer;
            var printColors = this.get("configuration.printColors.$items");
            return printColors[fixedLayerIndex].color().toString();
        },

        loaderSize: function() {
            return Math.min(this.$.height, this.$.width) * 0.5;
        }.onChange("width", "height"),

        loaderPos: function() {
            var s = this.loaderSize() * 0.5;
            return {
                x: this.$.width * 0.5 - s,
                y: this.$.height * 0.5 - s
            }
        }.onChange("width", "height")

    })
});