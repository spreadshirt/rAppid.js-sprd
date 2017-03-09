define(["js/ui/View", "sprd/data/ImageService", "sprd/model/PrintType", "sprd/config/SpecialFlex"], function(View, ImageService, PrintType, SpecialFlex) {

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
                return printType && printType.$.id === PrintType.Mapping.SpecialFlex;
            }

            return false;
        }.onChange("printColor"),

        backgroundImage: function() {
            if (!(this.isImagePrintColor() && this.$.printColor && this.$.imageService)) {
                return null;
            }

            if (this.getColorIndex() != null) {
                return "url(" + this.baseUrl("sprd/img/specialFlex.png") + ")";
            } else {
                return this.$.imageService.printColorImage(this.$.printColor.$.id, {
                    width: this.$.width,
                    height: this.$.height
                });
            }

        }.onChange('printColor', "imageService"),

        backgroundPosition: function() {
            var index = this.getColorIndex(),
                backgroundSize = this.$.backgroundSize,
                scalingFactor = parseInt(backgroundSize.replace(/[^\d.]/g, ''));

            if (index == null) {
                return "";
            }

            return "0 " + ((index) * -scalingFactor) + "px";
        }.onChange('printColor'),

        getColorIndex: function() {
            var color = this.$.printColor;
            if (!color) {
                return null;
            }
            return (SpecialFlex[this.PARAMETER().platform] || {})[color.$.id];
        }
    });
});