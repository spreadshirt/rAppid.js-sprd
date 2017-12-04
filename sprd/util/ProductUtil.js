define(["underscore", "sprd/util/ArrayUtil", "js/core/List", "sprd/model/ProductType", "flow", "sprd/entity/Price", "sprd/model/PrintType", "sprd/config/NeonFlexColors", "sprd/config/RealisticFlexColors", "sprd/config/Settings", 'js/type/Color'], function(_, ArrayUtil, List, ProductType, flow, Price, PrintType, NeonFlexColors, RealisticFlexColors, Settings, Color) {

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

        getPossiblePrintTypesForDesignOnProduct: function(design, product) {
            var defaultPrintArea = product.$.view.getDefaultPrintArea();

            if (!defaultPrintArea) {
                return [];
            }

            return this.getPossiblePrintTypesForDesignOnPrintArea(design, defaultPrintArea, product.$.appearance);

        },

        getPossiblePrintTypesForConfiguration: function(configuration, appearance, options) {
            if (!configuration) {
                return null;
            }

            options = options || {};

            var possiblePrintTypes = configuration.getPossiblePrintTypes(appearance);
            if (!options.skipValidation) {
                return _.filter(possiblePrintTypes, function(printType) {
                    var validations = configuration._validatePrintTypeSize(printType, configuration.width(), configuration.height(), configuration.$.scale);
                    return _.every(validations, function(validation) {
                        return !validation;
                    })
                });
            }

            return possiblePrintTypes;
        },

        getPossiblePrintTypesForTextOnPrintArea: function(fontFamily, printArea, appearance) {
            return ArrayUtil.average(fontFamily.$.printTypes.$items,
                this.getPossiblePrintTypesForPrintAreas([printArea], appearance))
                .sort(this.sortPrintTypeByWeight);
        },

        getPossiblePrintTypesForPrintAreas: function(printAreas, appearance) {
            var ret = [];

            if (!appearance) {
                return ret;
            }

            printAreas = ArrayUtil.getAsArray(printAreas);
            var printTypesBlacklist = _.map(printAreas, function(printArea) {
                    return printArea.$.restrictions.$.excludedPrintTypes.$items;
                }),
                printTypesWhitelist = appearance.$.printTypes.$items;
            printTypesBlacklist = _.flatten(printTypesBlacklist, true);

            ret = _.difference(printTypesWhitelist, printTypesBlacklist);
            ret.sort(this.sortPrintTypeByWeight);
            return ret;
        },

        isSpecialFoil: function(printType) {
            return this.isFlock(printType) || this.isSpecialFlex(printType);
        },

        isFlock: function(printType) {
            return printType && printType.$.id === PrintType.Mapping.Flock;
        },

        isSpecialFlex: function(printType) {
            return printType && printType.$.id === PrintType.Mapping.SpecialFlex;
        },

        getPossiblePrintTypesForSpecialText: function(printArea, appearance) {
            return _.filter(this.getPossiblePrintTypesForPrintAreas([printArea], appearance) || [],
                function(printType) {
                    // just digital print types
                    return !printType.isPrintColorColorSpace() && printType.isScalable();
                });
        },

        getCheapestPriceForDesignOnProduct: function(design, product) {
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

        supportsPrintType: function(product, configuration, printTypeId, options) {
            return this.hasPrintType(product, configuration, function(printType) {
                return printType.$.id === printTypeId;
            }, options)
        },

        supportsNoPrintType: function(product, configuration) {
            if (!configuration || !product) {
                return false;
            }

            var appearance = product.get('appearance');

            if (appearance) {
                var possiblePrintTypes = this.getPossiblePrintTypesForConfiguration(configuration, appearance);
                return !possiblePrintTypes.length;
            }


            return false;
        },

        findPrintType: function(product, configuration, predicate, options) {
            var possiblePrintTypes = this.getPossiblePrintTypesForConfiguration(configuration, product.$.appearance, options);
            return _.find(possiblePrintTypes, function(printType) {
                return predicate(printType);
            });
        },

        hasPrintType: function(product, configuration, predicate, options) {
            return !!this.findPrintType(product, configuration, predicate, options);
        },

        supportsDigital: function(product, configuration, options) {
            return this.hasPrintType(product, configuration, function(printType) {
                return !printType.isPrintColorColorSpace();
            }, options)
        },

        supportsNonDigital: function(product, configuration, options) {
            return this.hasPrintType(product, configuration, function(printType) {
                return printType.isPrintColorColorSpace();
            }, options)
        },

        isSpecial: function(configuration) {
            if (!configuration.$stage) {
                return false;
            }

            var platform = configuration.$stage.PARAMETER().platform;
            return configuration.$.printType && configuration.$.printType.$.id === PrintType.Mapping.SpecialFlex
                || _.some(configuration.$.printColors.$items, function(printColor) {
                    return NeonFlexColors[platform].indexOf(printColor.$.id) !== -1;
                });
        },

        isRealisticFlex: function(configuration) {
            if (!configuration.$stage) {
                return false;
            }

            var platform = configuration.$stage.PARAMETER().platform;
            return configuration.$.printType && configuration.$.printType.$.id === PrintType.Mapping.SpecialFlex
                || _.some(configuration.$.printColors.$items, function(printColor) {
                    return RealisticFlexColors[platform].hasOwnProperty(printColor.$.id);
                });
        }
    };
});
