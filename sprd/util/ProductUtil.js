define(["underscore"], function (_) {

    var ProductUtil = {

        getPossiblePrintTypes: function(printTypesA, printTypesB) {
            var ret = [];

            _.each(printTypesA, function(printType) {
                if (_.contains(printTypesB, printType)) {
                    ret.push(printType);
                }
            });

            return ret;
        }
    };

    return ProductUtil;

});