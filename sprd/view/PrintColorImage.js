define(["xaml!sprd/view/Image", "sprd/data/ImageService", "sprd/model/PrintType"], function (Image, ImageService, PrintType) {

    return Image.inherit('sprd.view.PrintColorImage', {

        defaults: {
            printColor: null
        },

        inject: {
            imageService: ImageService
        },

        _commitPrintColor: function(printColor) {

            var img = this.$.$img,
                backgroundColor = null;


            if (!img) {
                return;
            }

            if (printColor) {
                if (!this._isImagePrintColor()) {
                    backgroundColor = printColor.toHexString();
                }
            } else {
                this.set('loaded', true);
            }

            img.set('background-color', backgroundColor);

        },

        _renderPrintColor: function(printColor) {

            if (!printColor) {
                return;
            }

            this._setAttribute("data-print-color-id", printColor.$.id);
        },

        alt: function() {
            // TODO: translate colors

            var printColor = this.$.printColor;
            if (printColor && this._isImagePrintColor()) {
                return printColor.$.name;
            }

            return "";

        }.onChange("printColor"),

        _isImagePrintColor: function() {

            var printColor = this.$.printColor;
            if (printColor) {
                var printType = printColor.getPrintType();
                if (printType && printType.$.id === PrintType.Mapping.SpecialFlex) {
                    return true;
                }
            }

            return false;
        },

        imageUrl: function () {
            var imageService = this.$.imageService,
                printColor = this.$.printColor;

            if (printColor && imageService) {

                if (this._isImagePrintColor()) {
                    return imageService.printColorImage(printColor.$.id, {
                        width: this.$.width,
                        height: this.$.height
                    });
                } else {
                    return imageService.emptyImage();
                }
            }

            return null;

        }.onChange('printColor')
    });
});