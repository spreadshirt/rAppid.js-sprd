define(["underscore", "sprd/util/ArrayUtil", "js/core/List", "sprd/model/ProductType", "flow", "sprd/entity/Price"], function (_, ArrayUtil, List, ProductType, flow, Price) {

    return {

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

        getCheapestPriceForDesignOnProduct: function (design, product) {
            var possiblePrintTypes = this.getPossiblePrintTypesForDesignOnProduct(design, product),
                cheapestPrintTypePrice = null;
            if (possiblePrintTypes.length) {
                for (var i = 0; i < possiblePrintTypes.length; i++) {
                    var price = new Price();
                    var printType = possiblePrintTypes[i];
                    if (printType.isPrintColorColorSpace()) {
                        var printColor = printType.getClosestPrintColor(design.$.colors.at(0).$.default);
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