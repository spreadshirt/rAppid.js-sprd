define([], function() {
    var floatEpsilon = Math.pow(10, -10);

    var number = Number.prototype;
    number.equals = function(num) {
        return Math.abs(this - num) < floatEpsilon;
    };

    return true;
});