define(["underscore", "sprd/util/ArrayUtil", "js/core/List", "sprd/model/ProductType", "flow", "sprd/entity/Price"], function (_, ArrayUtil, List, ProductType, flow, Price) {

    return {

        DesignServiceState: {
            APPROVED: "APPROVED",
            TO_BE_APPROVED: "TO_BE_APPROVED",
            REJECTED: "REJECTED",
            TO_BE_APPROVED_BY_USER: "TO_BE_APPROVED_BY_USER"
        },

        getPossiblePrintTypesForDesignOnPrintArea: function (design, printArea, appearanceId) {
            return ArrayUtil.average(design.$.printTypes.$items,
                this.getPossiblePrintTypesForPrintAreas([printArea], appearanceId));
        },

        getPossiblePrintTypesForDesignOnProduct: function (design, product) {
            return this.getPossiblePrintTypesForDesignOnPrintArea(design, product.$.view.getDefaultPrintArea(), product.$.appearance.$.id);

        },

        getPossiblePrintTypesForTextOnPrintArea: function (fontFamily, printArea, appearanceId) {
            return ArrayUtil.average(fontFamily.$.printTypes.$items,
                this.getPossiblePrintTypesForPrintAreas([printArea], appearanceId));
        },

        getPossiblePrintTypesForPrintAreas: function (printAreas, appearanceId) {
            var ret = [];

            printAreas = ArrayUtil.getAsArray(printAreas);

            _.each(printAreas, function (printArea) {

                var productType = printArea.$parent,
                    appearance = productType.getAppearanceById(appearanceId);

                if (appearance) {
                    _.each(appearance.$.printTypes.$items, function (printType) {
                        if (!_.contains(printArea.$.restrictions.$.excludedPrintTypes.$items, printType) && !_.contains(ret, printType)) {
                            ret.push(printType);
                        }
                    });
                }
            });

            return ret;
        },

        getPossiblePrintTypesForSpecialText: function (printArea, appearanceId) {
            return _.filter(this.getPossiblePrintTypesForPrintAreas([printArea], appearanceId) || [],
                function (printType) {
                    // just digital print types
                    return !printType.isPrintColorColorSpace() && printType.isScalable();
                });
        },

        getCheapestPriceForDesignOnProduct: function (design, product) {
            var possiblePrintTypes = this.getPossiblePrintTypesForDesignOnProduct(design, product),
                cheapestPrintTypePrice = null;
            if (possiblePrintTypes.length) {
                for (var i = 0; i < possiblePrintTypes.length; i++) {
                    var price = new Price();
                    var printType = possiblePrintTypes[i];
                    if (printType.isPrintColorColorSpace()) {
                        var printColor = printType.getClosestPrintColor(design.$.colors.at(0).get('default'));
                        price.add(printColor.$.price);
                    }
                    price.add(printType.$.price);
                    price.add(design.$.price);

                    if (!cheapestPrintTypePrice || cheapestPrintTypePrice.$.vatIncluded > price.$.vatIncluded) {
                        cheapestPrintTypePrice = price;
                    }

                }
            }
            return cheapestPrintTypePrice;
        },

        fetchColorsForProductTypes: function (productTypes, minDistance, callback) {
            minDistance = minDistance || 2;

            var colors = new List();

            flow()
                .parEach(productTypes, function (item, cb) {
                    item.fetch(null, cb);
                })
                .seqEach(productTypes, function (productType, cb) {
                    productType.$.appearances.each(function (appearance) {
                        var merge = false;
                        colors.each(function (color) {
                            merge = appearance.$.color.distanceTo(color) < minDistance;
                        });
                        if (!merge) {
                            colors.add(appearance.$.color);
                        }
                    });
                })
                .exec(function (err) {
                    callback(err, colors);
                });
        },

        /**
         * Returns if the vector design is already processed.
         *
         * @param {Object} design
         * @returns {boolean}
         */
        isDesignServiceStateApproved: function (design) {
            return design.$.designServiceState == this.DesignServiceState.APPROVED;
        },

        /**
         * Returns if the vector design is still in the processing.
         *
         * @param {Object} design
         * @returns {boolean}
         */
        isDesignServiceStateChecking: function (design) {
            return design.$.designServiceState == this.DesignServiceState.TO_BE_APPROVED;
        },

        /**
         * Returns if the vector design is rejected.
         *
         * @param {Object} design
         * @returns {boolean}
         */
        isDesignServiceStateRejected: function (design) {
            return design.$.designServiceState == this.DesignServiceState.REJECTED;
        },

        /**
         * Returns if the vector design needs an approval.
         *
         * @param {Object} design
         * @returns {boolean}
         */
        isDesignServiceStateRequireApproval: function (design) {
            return design.$.designServiceState == this.DesignServiceState.TO_BE_APPROVED_BY_USER;
        }
    };

});
