define(["sprd/util/ProductUtil", "underscore"], function(ProductUtil, _) {

    var designPrintTypesCache = {};

    return {
        canBePrinted: function(design, product, printTypes, printArea) {
            product = product || this.$.product;
            printArea = printArea || product.$.view.getDefaultPrintArea();

            if (!(design && product && product.$.appearance && (printTypes || design.$.printTypes))) {
                return false;
            }

            var cacheId = [design.$.id, product.$.view.$.id, product.$.appearance.$.id].join("-");
            if (!printTypes && !designPrintTypesCache[cacheId]) {
                designPrintTypesCache[cacheId] = ProductUtil.getPossiblePrintTypesForDesignOnProduct(design, product)
            }

            var possiblePrintTypes = printTypes || designPrintTypesCache[cacheId];
            if (possiblePrintTypes.length === 0) {
                return false;
            }

            if (!printArea) {
                return false;
            }

            if (!design.isVectorDesign()) {
                // no errors to expect caused by size
                return true;
            }

            if (printArea.hasSoftBoundary()) {
                // will be clipped, so no max bound error to expect
                return true;
            }

            // check if we have a shrinkable type, as then the minimum scale doesn't play a role
            var digitalPrintType = _.find(possiblePrintTypes, function(printType) {
                return printType.isShrinkable();
            });

            if (digitalPrintType) {
                return true;
            }

            var minimumScale = (design.get("restrictions.minimumScale") || 100) / 100;

            // check minimum scale
            var hardBoundaryError = minimumScale * design.get("size.width") > printArea.width() || minimumScale * design.get("size.height") > printArea.height();

            return !hardBoundaryError;
        },

        canBePrintedSinglePrintType: function(design, printType, printArea) {
            if (!design) {
                throw new Error("No design supplied to check printability with.");
            }

            if (!printArea) {
                return false;
            }

            if (!design.isVectorDesign()) {
                // no errors to expect caused by size
                return true;
            }

            if (printArea.hasSoftBoundary()) {
                // will be clipped, so no max bound error to expect
                return true;
            }


            if (printType.isShrinkable()) {
                return true;
            }

            var minimumScale = (design.get("restrictions.minimumScale") || 100) / 100;

            // check minimum scale
            var hardBoundaryError = minimumScale * design.get("size.width") > printArea.width() || minimumScale * design.get("size.height") > printArea.height();

            return !hardBoundaryError;
        }
    }

});