define(["sprd/util/ProductUtil", "underscore", "js/core/Base"], function(ProductUtil, _, Base) {

    var designPrintTypesCache = {};

    return Base.inherit({}, {

        canBePrintedOnProduct: function(design, product) {
            product = product || this.get("product");
            var printAreas = product.get("productType.printAreas");
            var self = this;

            var printArea = _.find(printAreas.$items, function(printArea) {
                return self.canBePrinted(design, product, null, printArea);
            });

            return !!printArea;
        },

        canBePrinted: function(design, product, printTypes, printArea, options) {
            options = options || {};
            product = product || this.get("product");

            if (!product) {
                return false;
            }

            if (!design) {
                return false;
            }

            var appearance = product.$.appearance,
                view = product.$.view;

            if (!appearance || !view) {
                return false;
            }

            if (!printTypes && !design.$.printTypes) {
                return false;
            }

            printArea = printArea || view.getDefaultPrintArea();

            if (!printArea) {
                return false;
            }

            var cacheId = [design.$.id, view.$.id, printArea.$.id, appearance.$.id].join("-");
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

            if (printArea.hasSoftBoundary() && options.clippingAllowed) {
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

        canBePrintedSinglePrintType: function(design, printType, printArea, options) {
            options = options || {};

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

            if (printArea.hasSoftBoundary() && options.clippingAllowed) {
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
    });


});