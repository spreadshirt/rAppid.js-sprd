define(["sprd/manager/IDesignConfigurationManager", 'sprd/util/UnitUtil', "sprd/model/Design", "flow", "sprd/entity/Size", "underscore", "sprd/model/Mask", "rAppid", "js/data/Model", "sprd/config/Settings"], function (Base, UnitUtil, Design, flow, Size, _, Mask, rappid, Model, Settings) {


    return Base.inherit("sprd.manager.DesignConfigurationManager", {
        extractDesign: function (configuration) {
            var designId,
                content = configuration.$$ || {},
                designReference = content.design,
                svg = content.svg;

            if (designReference && designReference.href) {
                designId = designReference.href.split("/").pop();
            }

            if (svg) {
                designId = designId || svg.image.designId;
            }

            if (designId) {
                return configuration.$context.$contextModel.$context.createEntity(Design, designId);
            }
        },

        extractOriginalDesign: function (configuration) {
            var design,
                properties = configuration.$.properties;

            if (properties.type === 'afterEffect' && properties.afterEffect && properties.afterEffect.originalDesign) {
                var originalDesign = properties.afterEffect.originalDesign,
                    designId = originalDesign.href.split("/").pop();

                design = configuration.$context.$contextModel.$context.createEntity(Design, designId);
                design.set('wtfMbsId', originalDesign.id);
            }

            return design;
        },

        extractPrintArea: function (configuration) {
            var content = configuration.$$ || {},
                printArea;
            if (content.printArea) {
                printArea = configuration.$context.$contextModel.$.productType.getPrintAreaById(content.printArea.$.id);
            } else {
                printArea = configuration.$.printArea;
            }

            return printArea;
        },

        extractPrintColors: function (configuration, options) {
            var printType = configuration.$.printType,
                design = configuration.$.design,
                svg = configuration.$$ && configuration.$$.svg;

            // set print colors
            var printColors = [],
                designColorsRGBs = configuration.$.designColorRGBs,
                designColorIds = configuration.$.designColorIds,
                designColors = design ? design.$.colors : null,
                values, i,
                colorsSet = false,
                printColor;

            if (svg) {

                var key,
                    method;

                if (svg.image.hasOwnProperty("printColorIds") && printType.isPrintColorColorSpace()) {
                    key = "printColorIds";
                    method = "getPrintColorById";
                } else {
                    key = "printColorRGBs";
                    method = "getClosestPrintColor";
                }

                if (svg.image[key]) {
                    values = svg.image[key].split(" ");
                    for (i = 0; i < values.length; i++) {
                        printColor = printType[method](values[i]);

                        if (!printColor && method === "getPrintColorById") {
                            printColor = printType.getClosestPrintColor(svg.image["printColorRGBs"].split(" ")[i]);
                        }

                        if (!printColor) {
                            if (printType.isPrintColorColorSpace()) {
                                printColor = printType.$.colors.at(0);
                            } else {
                                printColor = printType.getClosestPrintColor("#000000");
                            }
                        }

                        if (!printColor) {
                            console.log("No print color found for print type " + printType.$.id + " " + values[i]);
                        }

                        printColors.push(printColor);
                    }

                    colorsSet = true;
                }
            } else if (designColorIds && designColorIds.length) {

                colorsSet = true;

                for (i = 0; i < designColorIds.length; i++) {
                    printColor = printType.getPrintColorById(designColorIds[i]);
                    printColors.push(printColor);
                    if (!printColor) {
                        colorsSet = false;
                        break;
                    }
                }
            } else if (designColorsRGBs && designColorsRGBs.length) {
                colorsSet = true;

                for (i = 0; i < designColorsRGBs.length; i++) {
                    printColor = printType.getClosestPrintColor(designColorsRGBs[i]);
                    printColors.push(printColor);
                    if (!printColor) {
                        colorsSet = false;
                        break;
                    }
                }
            }

            if (!colorsSet && designColors) {
                printColors = configuration.getDesignColors();


                if (designColors.$items.length === 1 && options && options.ensureDesignColorContrast && configuration.$context && configuration.$context.$contextModel) {
                    var product = configuration.$context.$contextModel,
                        printArea = configuration.$.printArea || product.$.view.getDefaultPrintArea(),
                        appearanceColorIndex = printArea && printArea.$.appearanceColorIndex || 0,
                        appearanceColors = product.get("appearance.colors"),
                        appearanceColor = appearanceColors.at(appearanceColorIndex).color();

                    var firstLayer = designColors.at(0);
                    var designColor = (firstLayer.$["default"] || firstLayer.$["origin"]);
                    if (appearanceColor && designColor && designColor.distanceTo(appearanceColor) < Settings.COLOR_CONVERSION_THRESHOLD) {
                        printColors = configuration.getInvertedDesignColors();
                    }
                }
            }

            if (printColors && design.isVectorDesign() && options.switch1EtoWhite) {
                printColors = configuration.get1EtoWhiteDesignColors();
            }

            configuration.$.printColors.reset(printColors);
            configuration.set('printType', printType, {
                force: true,
                preventValidation: true
            });
        },

        switch1EtoWhite: function (printColors) {
            if (!printColors || !printColor.length) {
                return [];
            }

            return printColors.each
        },

        extractSize: function (configuration, options) {
            var content = configuration.$$ || {},
                svg = content && content.svg,
                design = configuration.$.design;

            options = options || {};

            if (svg) {
                var size = new Size({
                    width: 100,
                    height: 100
                });

                if (configuration.$.processedSize) {
                    size = configuration.size();
                } else if (!options.noDesignFetch && design) {
                    size = UnitUtil.convertSizeToMm(design.$.size, configuration.$.printType.$.dpi);
                } else if (configuration.$.generatedWidth) {
                    // here we have a special text configuration
                    // with a generated image width
                    size = UnitUtil.convertSizeToMm(new Size({
                        width: configuration.$.generatedWidth,
                        height: svg.image.height / svg.image.width * configuration.$.generatedWidth,
                        unit: "px"
                    }), configuration.$.printType.$.dpi);
                }

                var match,
                    type,
                    values,
                    ret = {
                        scale: {
                            x: Math.round(svg.image.width / size.$.width, 3),
                            y: Math.round(svg.image.height / size.$.height, 3)
                        }
                    };

                var regExp = /^(\w+)\(([^(]+)\)/ig;
                while ((match = regExp.exec(svg.image.transform))) {
                    type = match[1];
                    values = match[2].split(",");
                    if (type === "rotate") {
                        ret.rotation = parseFloat(values.shift());
                    } else if (type === "scale") {
                        // only flipping
                        var scale = values;
                        ret.scale.x *= scale[0] < 0 ? -1 : 1;
                        ret.scale.x *= scale[1] < 0 ? -1 : 1;
                    }
                }

                configuration.set(ret, {preventValidation: true});
            }
        },

        extractMask: function (configuration, callback) {
            var properties = configuration.$.properties,
                self = this;

            if (!properties || !properties.afterEffect || configuration.$.afterEffect) {
                callback && callback();
                return;
            }

            var mask,
                id = properties.afterEffect.id,
                isUUID = _.isString(id) && id.indexOf("-");

            if (isUUID) {
                mask = this.$.designerApi.createEntity(Mask,id);
                mask.fetch(null, callback);
            } else {
                delete properties.afterEffect.offset;
                delete properties.afterEffect.scale;
                
                this.getMaskMapping(function (err, idMap) {
                    var matchedMap = _.find(idMap.$, function (map) {
                       return map.id == id;
                    });

                    if (matchedMap) {
                        mask = self.$.designerApi.createEntity(Mask, matchedMap.uuid);
                        mask.fetch(null, callback);
                    } else {
                        callback(new Error("Tried to map id " + id + " to a uuid. No mapping found."));
                    }
                })
            }


        },

        extractMaskSettings: function (configuration, afterEffect, cb) {
            var properties = configuration.$.properties;

            if (properties && properties.afterEffect && afterEffect) {


                if (properties.afterEffect.offset && properties.afterEffect.scale) {
                    afterEffect.$.offset.set(properties.afterEffect.offset);
                    afterEffect.$.scale.set(properties.afterEffect.scale);

                    afterEffect.set('initialized', true);
                }
                
                afterEffect.callback = cb;
                configuration.set('afterEffect', afterEffect);
            } else {
                cb();
            }
        },

        getMaskMapping: function (cb) {
            var idMapping = this.$.designerApi.createEntity(Model);
            idMapping.fetch(function (err) {
                if (!err) {
                    cb(null, idMapping);
                }
            })
        },

        initializeConfiguration: function (configuration, options, callback) {
            var printType = configuration.$.printType,
                printArea = this.extractPrintArea(configuration),
                self = this,
                design = this.extractOriginalDesign(configuration)
                    || this.extractDesign(configuration)
                    || configuration.$.design;

            flow()
                .par(function (cb) {
                    if (design && !options.noDesignFetch) {
                        design.fetch({
                            fetchInShop: options.fetchInShop
                        }, cb);
                    } else {
                        cb();
                    }

                }, function (cb) {
                    printType.fetch(null, cb);
                })
                .seq(function () {
                    configuration.set({
                        design: design,
                        printArea: printArea
                    });
                })
                .seq(function () {
                    self.extractPrintColors(configuration, options);
                })
                .seq("mask", function (cb) {
                    self.extractMask(configuration, cb);
                })
                .seq(function (cb) {
                    self.extractMaskSettings(configuration, this.vars.mask, cb);
                })
                .seq(function () {
                    self.extractSize(configuration, options);
                })
                .exec(callback);
        }
    });
});