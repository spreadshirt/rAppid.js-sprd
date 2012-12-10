define(["underscore", "sprd/util/ArrayUtil"], function (_, ArrayUtil) {

    return {

        getPossiblePrintTypesForDesignOnPrintArea: function (design, printArea, appearanceId) {
            return ArrayUtil.average(design.$.printTypes.$items,
                this.getPossiblePrintTypesForPrintAreas([printArea], appearanceId))
        },

        getPossiblePrintTypesForPrintAreas: function (printAreas, appearanceId) {
            var ret = [];

            printAreas = ArrayUtil.getAsArray(printAreas);

            _.each(printAreas, function (printArea) {

                var productType = printArea.$parent,
                    appearance = productType.getAppearanceById(appearanceId);

                if (appearance) {
                    _.each(appearance.$.printTypes.$items, function (printType) {
                        if (!_.contains(printArea.$.restrictions.$.excludedPrintTypes.$items, printType) &&
                            !_.contains(ret, printType)) {
                            ret.push(printType);
                        }
                    });
                }
            });

            return ret;
        }

    };

});