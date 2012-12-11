define([], function(){

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
        }


    };

});