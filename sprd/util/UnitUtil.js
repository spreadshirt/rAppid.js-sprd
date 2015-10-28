define(["sprd/entity/Size"], function(Size){

    var ConvertToInch = {
            unit: "in",
            fromMm: function (mm) {
                return Math.round(mm / 25.4, 1);
            }
        },

        ConvertSizes = {
            us_US: ConvertToInch,
            en_GB: ConvertToInch,
            fr_CA: ConvertToInch
        };

    return {

        pointToMillimeter: function(point) {
            // one pt is 1/72in
            return point / 72 * 25.4;
        },

        millimeterToPoint: function(mm) {
            return mm / 25.4 * 72;
        },

        /***
         *
         * @param {Number} pixel
         * @param {Number} dpi
         * @return {Number} size in mm
         */
        pixelToMm: function(pixel, dpi) {
            // dots / inch
            return pixel * 25.4 / dpi;
        },

        ptToMm: function(pt) {
            return pt / 72 * 25.4;
        },

        mmToPt: function(mm) {
            return mm / 25.4 * 72;
        },

        convertSizeToMm: function (size, dpi) {
            if (size.$.unit === "px") {
                return new Size({
                    unit: "mm",
                    height: this.pixelToMm(size.$.height, dpi),
                    width: this.pixelToMm(size.$.width, dpi)
                });
            }

            return size;
        },

        getLocalizedSize: function (mm, locale) {
            if(mm == null){
                return null;
            }
            var converter = ConvertSizes[locale];

            if (converter) {
                var ret = converter.fromMm(mm).toFixed(2) + "";
                if (ret.split(".").length == 1) {
                    ret += ".0";
                }
                return ret + " in";
            }

            return mm + " mm";
        }

    };

});