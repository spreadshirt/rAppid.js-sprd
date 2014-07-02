define(['sprd/entity/DesignConfiguration', "sprd/util/ProductUtil", "underscore"], function (DesignConfiguration, ProductUtil, _) {

    var undefined;

    return DesignConfiguration.inherit('sprd.model.SpecialTextConfiguration', {

        defaults: {
        },

        type: "design",

        getPossiblePrintTypes: function (appearance) {
            var ret = [],
                printArea = this.$.printArea,
                design = this.$.design;

            if (printArea && appearance && design) {
                ret = _.filter(ProductUtil.getPossiblePrintTypesForPrintAreas(printArea, appearance.$.id) || [],
                    function (PrintType) {
                        // just digital print types
                        return !PrintType.isPrintColorColorSpace();
                    });
            }

            return ret;
        }.onChange("printArea"),

        isAllowedOnPrintArea: function (printArea) {
            return printArea && printArea.get("restrictions.designAllowed") == true &&
                printArea.get("restrictions.textAllowed") == true;
        },

        getPossiblePrintTypesForPrintArea: function (printArea, appearanceId) {
            return _.filter(ProductUtil.getPossiblePrintTypesForPrintAreas(printArea, appearanceId) || [],
                function (PrintType) {
                    // just digital print types
                    return !PrintType.isPrintColorColorSpace();
                });
        },

        minimumScale: function () {
            // TODO:
            return this.callBase();
        }
    });
});