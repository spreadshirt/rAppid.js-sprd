define(["sprd/util/ProductUtil", "underscore"], function(ProductUtil, _) {

    var designPrintTypesCache = {};

    var PrintValidator = {

        canBePrintedOnProduct: function(design, product) {
            product = product || this.$.product;
            var printAreas = product.get("productType.printAreas");

            var printArea = _.find(printAreas.$items, function(printArea) {
                return PrintValidator.canBePrinted(design, product, null, printArea);
            });

            return !!printArea;
        },

        canBePrinted: function(design, product, printTypes, printArea) {
            product = product || this.$.product;

            if(!product) {
                return false;
            }

            printArea = printArea || product.$.view.getDefaultPrintArea();
            var appearance = product.$.appearance;

            if (!(design && product && appearance && (printTypes || design.$.printTypes))) {
                return false;
            }

            var cacheId = [design.$.id, product.$.view.$.id, printArea.$.id, product.$.appearance.$.id].join("-");
            if (!printTypes && !designPrintTypesCache[cacheId]) {
                designPrintTypesCache[cacheId] = ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(design, printArea, appearance);
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
    };
    return PrintValidator;

});