define(["js/ui/View", "sprd/data/ImageService", "sprd/model/PrintType"], function (View, ImageService, PrintType) {

    return View.inherit('sprd.view.PrintColorImageClass', {

        defaults: {
            printColor: null,
            loaded: false,
            componentClass: "print-color-image",
            backgroundColor: "{backgroundColor()}"
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

        }.onChange("printColor.toHexString()"),

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
                return printType && printType.$.id === PrintType.Mapping.SpecialFlex;
            }

            return false;
        }.onChange("printColor"),

        url: function () {
            var imageService = this.$.imageService,
                printColor = this.$.printColor;

            if (printColor && imageService && this.isImagePrintColor()) {
                    return imageService.printColorImage(printColor.$.id, {
                        width: this.$.width,
                        height: this.$.height
                    });
            }

            return null;

        }.onChange('printColor', "imageService")
    });
});