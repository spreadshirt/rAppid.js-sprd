define(["js/ui/View", "sprd/data/ImageService", "sprd/model/PrintType", "sprd/config/SpecialFlex", "sprd/config/Flock", "sprd/config/RealisticFlexColors"], function(View, ImageService, PrintType, SpecialFlex, Flock, RealisticFlexColors) {

    return View.inherit('sprd.view.PrintColorImage', {

        defaults: {
            printColor: null,
            loaded: false,
            platform: "{PARAMETER().platform}",
            "data-print-color-id": "{printColor.id}",
            componentClass: "print-color-image {whiteClass()}",
            backgroundColor: "{backgroundColor()}",
            backgroundImage: "{backgroundImage()}",
            backgroundPosition: "{backgroundPosition()}",
            backgroundSize: "34px"
        },

        inject: {
            imageService: ImageService
        },

        _renderPrintColor: function(printColor) {

            if (!printColor) {
                return;
            }

            this._setAttribute("data-print-color-id", printColor.$.id);
        },

        backgroundColor: function() {
            if (this.isImagePrintColor()) {
                return;
            }

            return this.get("printColor.toHexString()");

        }.onChange("printColor", "printColor.toHexString()"),

        whiteClass: function() {
            return /#f{6}/i.test(this.get("printColor.toHexString()") || "") ? "white" : "";
        }.onChange("printColor"),

        alt: function() {
            // TODO: translate colors

            var printColor = this.$.printColor;
            if (printColor && this.isImagePrintColor()) {
                return printColor.$.name;
            }

            return "";

        }.onChange("printColor"),

        isImagePrintColor: function() {

            var printColor = this.$.printColor;
            if (printColor) {
                var printType = printColor.getPrintType();
                return printType && (
                    printType.$.id === PrintType.Mapping.SpecialFlex ||
                    printType.$.id === PrintType.Mapping.Flock ||
                    printColor.$.id in RealisticFlexColors[this.PARAMETER().platform]);
            }

            return false;
        }.onChange("printColor"),

        backgroundImage: function() {
            if (!(this.isImagePrintColor() && this.$.printColor && this.$.imageService)) {
                return null;
            }

            var colorInformation = this.getColorInformation();

            if (colorInformation.index != null) {
                if (colorInformation.printType === PrintType.Mapping.SpecialFlex) {
                    return "url(" + this.baseUrl("sprd/img/specialFlex.png") + ")";
                }

                if (colorInformation.printType === PrintType.Mapping.Flock) {
                    return "url(" + this.baseUrl("sprd/img/flock.png") + ")";
                }

                if (colorInformation.printType === PrintType.Mapping.Flex) {
                    return "url(" + this.baseUrl("sprd/img/realisticFlex.png") + ")";
                }
            } else {
                return this.$.imageService.printColorImage(this.$.printColor.$.id, {
                    width: this.$.width,
                    height: this.$.height
                });
            }

        }.onChange('printColor', "imageService"),

        backgroundPosition: function() {
            var information = this.getColorInformation(),
                backgroundSize = this.$.backgroundSize,
                scalingFactor = parseInt(backgroundSize.replace(/[^\d.]/g, ''));

            if (information.index == null) {
                return "";
            }

            return "-1px " + ((information.index) * -scalingFactor -1) + "px";
        }.onChange('printColor'),

        getColorInformation: function() {
            var color = this.$.printColor;
            if (!color) {
                return {};
            }

            var platform = this.PARAMETER().platform;
            var specialFlexColorIndex = (SpecialFlex[platform] || {})[color.$.id];
            var flockColorIndex = (Flock[platform] || {})[color.$.id];
            var realisticFlexColorIndex = (RealisticFlexColors[platform] || {})[color.$.id];

            if (specialFlexColorIndex !== undefined) {
                return {
                    index: specialFlexColorIndex,
                    printType: PrintType.Mapping.SpecialFlex
                };
            }

            if (flockColorIndex !== undefined) {
                return {
                    index: flockColorIndex,
                    printType: PrintType.Mapping.Flock
                };
            }

            if (realisticFlexColorIndex !== undefined) {
                return {
                    index: realisticFlexColorIndex,
                    printType: PrintType.Mapping.Flex
                };
            }

            return {};
        }
    });
});