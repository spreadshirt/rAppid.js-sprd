define(["underscore", "sprd/util/ArrayUtil", "js/core/List", "sprd/model/ProductType", "flow", "sprd/entity/Price", "sprd/model/PrintType", "sprd/config/NeonFlexColors", "sprd/config/RealisticFlexColors", "sprd/config/Settings", 'js/type/Color'], function(_, ArrayUtil, List, ProductType, flow, Price, PrintType, NeonFlexColors, RealisticFlexColors, Settings, Color) {

    var colorDistanceCache = {};
    var appearanceConfigurationCache = {};
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
        },

        getTooDarkConfigurations: function(product, configurations, callback) {
            var tooDarkConfigurations = [],
                self = this;

            flow()
                .parEach(configurations.$items, function(configuration, cb) {
                    self.isTooDark(product, configuration, function(err, tooDark) {
                        if (!err && tooDark) {
                            tooDarkConfigurations.push(configuration);
                        }

                        cb && cb(err);
                    })
                })
                .exec(function(err) {
                    callback && callback(err, tooDarkConfigurations);
                })
        },

        isTooDark: function(product, configuration, callback) {
            callback = callback || function() {
                };

            if (!(configuration && product)) {
                callback(null, false);
            }

            var printArea = configuration.$.printArea || product.$.view.getDefaultPrintArea(),
                appearanceColorIndex = printArea && printArea.$.appearanceColorIndex || 0,
                appearanceColors = product.get("appearance.colors"),
                appearanceColor = appearanceColors.at(appearanceColorIndex).color();

            if (!appearanceColor) {
                callback(null, false);
            }
            var tooDark = false,
                color = null,
                design = configuration.$.design,
                printColors = configuration.$.printColors;

            if (printColors && printColors.length) {
                var firstColor = printColors.at(0);
                color = firstColor.$["fill"];

                tooDark = color != null && color.distanceTo(appearanceColor) < Settings.COLOR_CONVERSION_THRESHOLD;
                callback(null, tooDark);
            } else if (design) {
                var self = this,
                    colorCode = appearanceColor.toString(),
                    designId = design.get("id"),
                    key = designId + "-" + colorCode,
                    img = new Image;

                var cachedCheck = appearanceConfigurationCache[key];

                if (cachedCheck) {
                    callback(null, cachedCheck.tooDark);
                } else {
                    img.onload = function() {
                        var black = new Color.RGB(0, 0, 0);
                        //if appearance close to black than use a stricter threshold
                        var useStrictThreshold = appearanceColor.distanceTo(black) < Settings.APPEARANCE_THRESHOLD;
                        var colorThreshold = useStrictThreshold ? Settings.STRICT_PIXEL_COLOR_THRESHOLD : Settings.DEFAULT_PIXEL_COLOR_THRESHOLD;

                        var analyzePixels = self.analyzePixels(img, appearanceColor, colorThreshold);

                        if (analyzePixels.borderSharePercentage > analyzePixels.innerSharePercentage) {
                            tooDark = analyzePixels.invisibleBorderPercentage > Settings.INVISIBLE_COLOR_PERCENTAGE;
                        } else {
                            tooDark = analyzePixels.invisibleInnerPercentage > Settings.INVISIBLE_COLOR_PERCENTAGE;
                        }

                        appearanceConfigurationCache[key] = {
                            "tooDark": tooDark
                        };

                        callback(null, tooDark);
                    };

                    img.src = configuration.$.imageService.designImage(design.$.wtfMbsId || design.$.id, {
                        width: 100,
                        version: design.$.version,
                        sameOrigin: true
                    });
                }
            } else {
                callback(null, false);
            }
        },

        analyzePixels: function(img, appearanceColor, threshValue) {
            var size = 100,
                space = 10,
                halfSpace = space / 2;

            var alphaCanvas = document.createElement("canvas"),
                borderCanvas = document.createElement("canvas"),
                imgCanvas = document.createElement("canvas");

            alphaCanvas.width = size + space;
            alphaCanvas.height = size + space;
            borderCanvas.width = size + space;
            borderCanvas.height = size + space;
            imgCanvas.width = size;
            imgCanvas.height = size;

            var alphaContext = alphaCanvas.getContext("2d"),
                borderContext = borderCanvas.getContext("2d"),
                imgContext = imgCanvas.getContext("2d");

            alphaContext.fillStyle = "black";
            alphaContext.fillRect(0, 0, size + space, size + space);
            alphaContext.globalCompositeOperation = "destination-out";

            // cut-out image to create alpha-mask
            alphaContext.drawImage(img, halfSpace, halfSpace, size, size);

            var dArr = [-1, -1, 0, -1, 1, -1, -1, 0, 1, 0, -1, 1, 0, 1, 1, 1], // offset array
                s = 1,  // thickness scale
                xPos = 0,  // final position
                yPos = 0;  // final position

            borderContext.globalCompositeOperation = "source-over";

            // blur mask to create a outline of the mask
            for (var i = 0; i < dArr.length; i += 2) {
                borderContext.drawImage(alphaCanvas, xPos + dArr[i] * s, yPos + dArr[i + 1] * s, size + space, size + space);
            }

            // cut out the mask to get only the outline (= border of the image)
            borderContext.globalCompositeOperation = "destination-out";
            borderContext.drawImage(alphaCanvas, 0, 0);

            borderContext.globalCompositeOperation = "source-in";
            borderContext.drawImage(img, halfSpace, halfSpace, size, size);

            imgContext.drawImage(img, 0, 0, size, size);

            var colorAdjusting = 10,
                totalPixel = 0,
                //IE 11 does not support Array.fill()
                borderDistance = new Array(101),
                borderDistanceTotal = 0,
                borderPixelAmount = 0,
                innerDistance = new Array(101),
                innerDistanceTotal = 0,
                innerPixelAmount = 0;

            for (var y = 0; y < size; y++) {
                for (var x = 0; x < size; x++) {
                    var imgPixel = imgContext.getImageData(x, y, 1, 1).data,
                        borderPixel = borderContext.getImageData(x + halfSpace, y + halfSpace, 1, 1).data;

                    var adjustedR = parseInt(imgPixel[0] / colorAdjusting) * colorAdjusting,
                        adjustedG = parseInt(imgPixel[1] / colorAdjusting) * colorAdjusting,
                        adjustedB = parseInt(imgPixel[2] / colorAdjusting) * colorAdjusting;

                    var borderPixelOpacity = borderPixel[3],
                        imgPixelOpacity = imgPixel[3],
                        imgPixelOpacityPercentage = imgPixelOpacity / 255;

                    var color = new Color.RGB(adjustedR, adjustedG, adjustedB),
                        distance = this.colorDistance(appearanceColor, color);
                    var currentDistance;

                    if (borderPixelOpacity > 0) {
                        currentDistance = (borderDistance[parseInt(distance)] || 0);
                        borderDistance[parseInt(distance)] = currentDistance + imgPixelOpacityPercentage;
                        borderDistanceTotal += imgPixelOpacityPercentage;

                        if (imgPixelOpacity) {
                            borderPixelAmount++;
                            totalPixel++;
                        }
                    } else {
                        currentDistance = (innerDistance[parseInt(distance)] || 0);
                        innerDistance[parseInt(distance)] = currentDistance + imgPixelOpacityPercentage;
                        innerDistanceTotal += imgPixelOpacityPercentage;

                        if (imgPixelOpacity) {
                            innerPixelAmount++;
                            totalPixel++;
                        }
                    }
                }
            }

            var invisibleBorderPixelTotal = 0,
                invisibleInnerPixelTotal = 0;

            for (i = 0; i <= threshValue; i++) {
                invisibleBorderPixelTotal += (borderDistance[i] || 0);
                invisibleInnerPixelTotal += (innerDistance[i] || 0);
            }

            return {
                borderSharePercentage: borderPixelAmount / (totalPixel / 100),
                innerSharePercentage: innerPixelAmount / (totalPixel / 100),
                invisibleBorderPercentage: invisibleBorderPixelTotal / (borderDistanceTotal / 100),
                invisibleInnerPercentage: invisibleInnerPixelTotal / (innerDistanceTotal / 100)
            };
        },

        colorDistance: function(color1, color2) {
            var cacheKey = color1.toHexString() + "," + color2.toHexString();

            if (!colorDistanceCache[cacheKey]) {
                colorDistanceCache[cacheKey] = color1.distanceTo(color2);
            }

            return colorDistanceCache[cacheKey];
        }
    };
});
