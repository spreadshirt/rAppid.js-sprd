define(["underscore", "sprd/util/ArrayUtil", "js/core/List", "sprd/model/ProductType", "flow", "sprd/entity/Price"], function (_, ArrayUtil, List, ProductType, flow, Price) {

    return {

        sortPrintTypeByWeight: function(a, b) {
            return a.$.weight - b.$.weight;
        },

        getPossiblePrintTypesForDesignOnPrintArea: function(design, printArea, appearance) {

            if (!(design && design.$.printTypes)) {
                return [];
            }

            return ArrayUtil.average(design.$.printTypes.$items,
                this.getPossiblePrintTypesForPrintAreas([printArea], appearance))
                .sort(this.sortPrintTypeByWeight);
        },

        getPossiblePrintTypesForDesignOnProduct: function (design, product) {
            var defaultPrintArea = product.$.view.getDefaultPrintArea();

            if (!defaultPrintArea) {
                return [];
            }

            return this.getPossiblePrintTypesForDesignOnPrintArea(design, defaultPrintArea, product.$.appearance);

        },

        getPossiblePrintTypesForTextOnPrintArea: function(fontFamily, printArea, appearance) {
            return ArrayUtil.average(fontFamily.$.printTypes.$items,
                this.getPossiblePrintTypesForPrintAreas([printArea], appearance))
                .sort(this.sortPrintTypeByWeight);
        },

        getPossiblePrintTypesForPrintAreas: function(printAreas, appearance) {
            var ret = [];

            printAreas = ArrayUtil.getAsArray(printAreas);

            _.each(printAreas, function (printArea) {

                if (appearance) {
                    _.each(appearance.$.printTypes.$items, function (printType) {
                        if (!_.contains(printArea.$.restrictions.$.excludedPrintTypes.$items, printType) && !_.contains(ret, printType)) {
                            ret.push(printType);
                        }
                    });
                }
            });

            ret.sort(this.sortPrintTypeByWeight);

            return ret;
        },

        getPossiblePrintTypesForSpecialText: function(printArea, appearance) {
            return _.filter(this.getPossiblePrintTypesForPrintAreas([printArea], appearance) || [],
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
                        var firstColor = design.$.colors.at(0);
                        var printColor = printType.getClosestPrintColor(firstColor.get('default') || firstColor.get("origin"));
                        if (!printColor) {
                            continue;
                        }
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
        }
    };

});
