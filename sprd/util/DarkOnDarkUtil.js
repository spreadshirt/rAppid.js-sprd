define(["sprd/config/Settings", 'js/type/Color'], function(Settings, Color) {

    var colorDistanceCache = {};
    var appearanceConfigurationCache = {};
    var layerInformationCache = {};

    return {

        getTooDarkConfigurations: function(product, configurations, callback) {
            var tooDarkConfigurations = [],
                self = this;

            flow()
                .parEach(configurations.$items, function(configuration, cb) {
                    self._isTooDark(product, configuration, function(err, tooDark) {
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

        _isTooDark: function(product, configuration, callback) {
            // currently we can not check dod for special text, because the image comes
            // from a cross origin and getImageData() is not possible.
            if (!product  || !configuration || configuration.type == "specialText") {
                callback && callback(null, false);
                return;
            }

            var printArea = configuration.$.printArea || product.$.view.getDefaultPrintArea(),
                appearanceColorIndex = printArea && printArea.$.appearanceColorIndex || 0,
                appearanceColors = product.get("appearance.colors"),
                appearanceColor = appearanceColors.at(appearanceColorIndex).color();

            if (!appearanceColor) {
                callback && callback(null, false);
                return;
            }

            var key = this._getGeneratedCacheKey(configuration, appearanceColor),
                cachedCheck = key ? appearanceConfigurationCache[key] : "";

            if (cachedCheck) {
                callback(null, cachedCheck.tooDark);
                return;
            }

            var printColors = configuration.get("printColors"),
                design = configuration.get("design"),
                tooDark = false;

            if (printColors && printColors.length) {
                // check for 1 layer designs and text
                if (printColors.length == 1) {
                    console.log("1 layer, text check");
                    tooDark = this._isPrintColorTooDark(printColors.at(0), appearanceColor);
                    callback && callback(null, tooDark);
                    return;
                }

                // check if multilayer design has only one printColor
                var layersWithSameColor = [];
                for (var i = 0; i < printColors.length; i++) {
                    var firstColor = printColors.at(i);
                    var secondColor = printColors.at((i + 1) % printColors.length);

                    if (!firstColor.get("fill").distanceTo(secondColor.get("fill"))) {
                        layersWithSameColor.push([firstColor, secondColor]);
                    }
                }

                // if design has only one printColor
                if (layersWithSameColor.length >= printColors.length) {
                    console.log("same color check");
                    tooDark = this._isPrintColorTooDark(printColors.at(0), appearanceColor);

                    appearanceConfigurationCache[key] = {
                        "tooDark": tooDark
                    };

                    callback && callback(null, tooDark);
                    return;
                }

            }

            var self = this,
                printColorsAsRGB = configuration.getPrintColorsAsRGB();

            flow()
                .seq("layerInformation", function(cb) {
                    if (printColors.length) {
                        self._getLayerInformation(configuration, cb)
                    } else {
                        cb && cb();
                    }
                })
                .seq(function() {
                    // if the layers of a multilayer design have no big overlaps, then check every layer separately
                    // else (the design is a pixel design or has overlapping layers) do the pixel check
                    var layerInformation = this.vars.layerInformation;
                    if (printColors.length && layerInformation && !layerInformation.overlappingLayers.length) {
                        console.log("separated layer check");
                        for (var i = 0; i < printColors.length; i++) {
                            tooDark = self._isPrintColorTooDark(printColors.at(i), appearanceColor);

                            if (tooDark) {
                                break;
                            }
                        }

                        appearanceConfigurationCache[key] = {
                            "tooDark": tooDark
                        };

                        this.end();
                    }
                })
                .seq(function() {
                    if (printColors.length) {
                        var layerInformation = this.vars.layerInformation;
                        var overlappingLayers = layerInformation && layerInformation.overlappingLayers;
                        var separatedLayers = layerInformation && layerInformation.separatedLayers;

                        if (overlappingLayers.length && separatedLayers.length) {
                            console.log("remove separated layer");
                            //if the design has a separated layer, then ignore the layer for the pixel check
                            for (var i = 0; i < separatedLayers.length; i++) {
                                var layerIndex = separatedLayers[i];
                                printColorsAsRGB[layerIndex] = "none";
                                tooDark = self._isPrintColorTooDark(printColors.at(layerIndex), appearanceColor);

                                //if the separated layer too dark, then break up and don't do the pixel check;
                                if (tooDark) {
                                    appearanceConfigurationCache[key] = {
                                        "tooDark": tooDark
                                    };


                                    this.end();
                                    break;
                                }
                            }
                        }
                    }
                })
                .seq("image", function(cb) {
                    var img = new Image();

                    img.onload = function() {
                        cb(null, img);
                    };

                    img.src = configuration.$.imageService.designImage(design.$.wtfMbsId || design.$.id, {
                        width: 100,
                        version: design.$.version,
                        printColors: printColorsAsRGB,
                        sameOrigin: true
                    });
                })
                .seq(function() {
                    console.log("pixelcheck");
                    var black = new Color.RGB(0, 0, 0);
                    //if appearance close to black than use a stricter threshold
                    var useStrictThreshold = appearanceColor.distanceTo(black) < Settings.APPEARANCE_THRESHOLD;
                    var colorThreshold = useStrictThreshold ? Settings.STRICT_PIXEL_COLOR_THRESHOLD : Settings.DEFAULT_PIXEL_COLOR_THRESHOLD;

                    var analyzePixels = self._analyzePixels(this.vars.image, appearanceColor, colorThreshold);

                    if (analyzePixels.borderSharePercentage > analyzePixels.innerSharePercentage) {
                        tooDark = analyzePixels.invisibleBorderPercentage > Settings.INVISIBLE_COLOR_PERCENTAGE;
                    } else {
                        tooDark = analyzePixels.invisibleInnerPercentage > Settings.INVISIBLE_COLOR_PERCENTAGE;
                    }

                    appearanceConfigurationCache[key] = {
                        "tooDark": tooDark
                    };
                })
                .exec(function(err) {
                    callback && callback(err, tooDark);
                });
        },

        _getGeneratedCacheKey: function(configuration, appearanceColor) {
            var designId = configuration.get("design.id"),
                printColors = configuration.get("printColors"),
                key = null;

            if (designId) {
                key = appearanceColor ? appearanceColor.toString() + "-" : "";
                key += designId;

                for (var i = 0; printColors && i < printColors.length; i++) {
                    key += "-" + printColors.at(i).get("fill").toString();
                }
            }

            return key;
        },

        _isPrintColorTooDark: function(printColor, appearanceColor) {
            var color = printColor && printColor.$["fill"];
            return color != null && color.distanceTo(appearanceColor) < Settings.COLOR_CONVERSION_THRESHOLD;
        },

        _getLayerInformation: function(configuration, callback) {
            var design = configuration.get("design"),
                colors = configuration.get("design.colors.$items"),
                printColors = configuration.get("printColors");


            if (!design || !colors || !printColors) {
                callback && callback(null, []);
                return;
            }

            var key = this._getGeneratedCacheKey(configuration, null);
            var layerInformation = layerInformationCache[key] || [];

            if (layerInformation.length) {
                callback && callback(null, layerInformation);
                return;
            }

            var size = design.get("size"),
                options = {};

            if (size.$.width > size.$.height) {
                options.width = 100;
            } else {
                options.height = 100;
            }

            options.version = design.$.version;
            options.watermark = false;
            options.sameOrigin = true;

            var self = this,
                loadedImages = [];

            flow()
                .parEach(colors, function(color, cb) {
                    var layerIndex = color.get("layer"),
                        image = new Image(),
                        printColors = [];

                    for (var i = 0; i < configuration.$.printColors.size(); i++) {
                        printColors.push("none");
                    }

                    printColors[layerIndex] = "FFFFFF";

                    image.onload = function() {
                        loadedImages[layerIndex] = image;
                        cb && cb(null);
                    };

                    image.src = configuration.$.imageService.designImageFromCache(design.$.wtfMbsId || design.$.id, _.extend(options, {
                        printColors: printColors,
                        layerIndex: layerIndex
                    }));

                })
                .seq("layerInformation", function() {
                    var overlappingLayerPercentages = self._getOverlappingPercentages(loadedImages);
                    layerInformation = self._analyzeOverlap(overlappingLayerPercentages);
                })
                .exec(function(err, results) {
                    layerInformationCache[key] = results && results.layerInformation;
                    callback && callback(err, layerInformation);
                });
        },

        _getOverlappingPercentages: function(images) {
            var layer1 = images[0];
            var width = layer1.width,
                height = layer1.height;

            if(layer1.width > layer1.height) {
                height = (height / width) * 200;
                width = 200;
            } else {
                width = (width / height) * 200;
                height = 200;
            }

            var separatedLayerCanvas = document.createElement("canvas");
            separatedLayerCanvas.width = width;
            separatedLayerCanvas.height = height;
            var separatedLayerContext = separatedLayerCanvas.getContext("2d");

            var layerFilledPixelsAmounts = [];
            for (var i = 0; i < images.length; i++) {
                separatedLayerContext.drawImage(images[i], 0, 0, width, height);
                layerFilledPixelsAmounts[i] = this._getFilledPixelsAmount(separatedLayerCanvas);
                separatedLayerContext.clearRect(0, 0, width, height);
            }

            var overlappingCanvas = document.createElement("canvas");
            overlappingCanvas.width = width;
            overlappingCanvas.height = height;
            var overlappingContext = overlappingCanvas.getContext("2d");

            var overlappingPercentages = [];
            for (var j = 0; j < images.length; j++) {
                var firstLayer = images[j];
                var nextLayer = (j + 1) % images.length;
                var secondLayer = images[nextLayer];

                overlappingContext.globalCompositeOperation = "source-over";
                overlappingContext.clearRect(0, 0, width, height);
                overlappingContext.drawImage(firstLayer, 0, 0, width, height);
                overlappingContext.globalCompositeOperation = "destination-in";
                overlappingContext.drawImage(secondLayer, 0, 0, width, height);
                var overlappingPixelsAmount = this._getFilledPixelsAmount(overlappingCanvas);


                overlappingPercentages[j] = overlappingPercentages[j] || [];
                overlappingPercentages[j].push(overlappingPixelsAmount / (layerFilledPixelsAmounts[j] / 100));

                overlappingPercentages[nextLayer] = overlappingPercentages[nextLayer] || [];
                overlappingPercentages[nextLayer].push(overlappingPixelsAmount / (layerFilledPixelsAmounts[nextLayer] / 100));
            }

            return overlappingPercentages;
        },

        _getFilledPixelsAmount: function(canvas) {
            var context = canvas.getContext("2d"),
                imageData = context.getImageData(0, 0, canvas.width, canvas.height),
                filledPixels = 0;

            for (var i = 3; i < imageData.data.length; i += 4) {
                if (imageData.data[i]) {
                    filledPixels++;
                }
            }

            return filledPixels;
        },

        _analyzeOverlap: function(overlappingLayerPercentages) {
            var layerInformation = {
                overlappingLayers: [],
                separatedLayers: []
            };

            for (var i = 0; i < overlappingLayerPercentages.length; i++) {
                var layerPercentages = overlappingLayerPercentages[i];
                var hasBigOverlap = false;
                var isSeparatedLayer = true;

                for (var j = 0; j < layerPercentages.length; j++) {
                    hasBigOverlap = hasBigOverlap || layerPercentages[j] > Settings.OVERLAPPING_LAYER_PERCENTAGE;
                    isSeparatedLayer = isSeparatedLayer && layerPercentages[j] == 0;
                }

                if (hasBigOverlap) {
                    layerInformation.overlappingLayers.push(i);
                }

                if (isSeparatedLayer) {
                    layerInformation.separatedLayers.push(i);
                }
            }
            return layerInformation;
        },

        _analyzePixels: function(img, appearanceColor, threshValue) {
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
                        distance = this._colorDistance(appearanceColor, color);
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

        _colorDistance: function(color1, color2) {
            var cacheKey = color1.toHexString() + "," + color2.toHexString();

            if (!colorDistanceCache[cacheKey]) {
                colorDistanceCache[cacheKey] = color1.distanceTo(color2);
            }

            return colorDistanceCache[cacheKey];
        }


    }
});
