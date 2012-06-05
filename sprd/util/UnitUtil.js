define([], function(){

    return {

        pointToMillimeter: function(point) {
            // one pt is 1/72in
            return point / 72 * 25.4;
        },

        millimeterToPoint: function(mm) {
            return mm / 25.4 * 72;
        }

    };

});