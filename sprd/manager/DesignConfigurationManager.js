define(["sprd/manager/IDesignConfigurationManager", 'sprd/util/UnitUtil', "sprd/model/Design", "flow", "sprd/entity/Size", "sprd/config/AfterEffects", "underscore", "rAppid"], function(Base, UnitUtil, Design, flow, Size, AfterEffects, _, rappid) {
    return Base.inherit("sprd.manager.DesignConfigurationManager", {
        initializeConfiguration: function(configuration, options, callback) {

            var content = configuration.$$ || {},
                designReference = content.design,
                svg = content.svg,
                printType = configuration.$.printType,
                printArea,
                properties = configuration.$.properties,
                self = this,
                design = configuration.$.design;

            if (svg) {
                var designId;

                if (designReference && designReference.href) {
                    designId = designReference.href.split("/").pop();
                }

                designId = designId || svg.image.designId;
                if (designId && designId != "undefined") {
                    design = configuration.$context.$contextModel.$context.createEntity(Design, designId);
                }
            }


            var afterEffect = properties.afterEffect,
                originalDesign = properties.originalDesign;

            if (self.$stage.PARAMETER().mode == "admin" && properties.type == 'afterEffect' && afterEffect && originalDesign) {
                designId = originalDesign.href.split("/").pop();
                design = configuration.$context.$contextModel.$context.createEntity(Design, designId);
                design.set('wtfMbsId', originalDesign.id);
            }

            flow()
                .par(function(cb) {
                    if (design) {
                        design.fetch({
                            fetchInShop: options.fetchInShop
                        }, cb);
                    } else {
                        cb();
                    }

                }, function(cb) {
                    printType.fetch(null, cb);
                })
                .seq(function() {
                    if (content.printArea) {
                        printArea = configuration.$context.$contextModel.$.productType.getPrintAreaById(content.printArea.$.id);
                    } else {
                        printArea = configuration.$.printArea;
                    }
                })
                .seq(function() {
                    configuration.set({
                        design: design,
                        printArea: printArea
                    });
                })
                .seq(function() {
                    var printType = configuration.$.printType;

                    // set print colors
                    var printColors = [],
                        defaultPrintColors = [],
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
                        printColors = [];

                        designColors.each(function(designColor) {
                            var closestPrintColor = printType.getClosestPrintColor(designColor.$["default"] || designColor.$["origin"]);
                            printColors.push(closestPrintColor);
                            defaultPrintColors.push(closestPrintColor);
                        });

                        configuration.$defaultPrintColors = defaultPrintColors;
                    }

                    configuration.$.printColors.reset(printColors);
                    configuration.set('printType', printType, {force: true});
                })
                .seq(function() {

                    if (svg) {
                        var size = new Size({
                            width: 100,
                            height: 100
                        });

                        if (design) {
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
                })
                .seq(function() {
                    if (self.$stage.PARAMETER().mode == "admin" && properties && properties.afterEffect) {
                        var baseUrl = function(url) {
                            return self.$stage.baseUrl ? self.$stage.baseUrl.call(self, url) : url;
                        };

                        var afterEffects = AfterEffects(baseUrl);

                        var afterEffect = _.find(afterEffects.masks, function(mask) {
                            return mask.$.id == properties.afterEffect.id;
                        });

                        afterEffect.$.offset.set({
                            'x': properties.afterEffect.offset.x,
                            'y': properties.afterEffect.offset.y
                        });

                        afterEffect.$.scale.set({
                            'x': properties.afterEffect.scale.x,
                            'y': properties.afterEffect.scale.y
                        });

                        afterEffect.set('initialized', true);
                        configuration.set('afterEffect', afterEffect);
                    }
                })
                .seq(function() {
                    var afterEffect = configuration.$.afterEffect;
                    var design = configuration.$.design;
                    var id = design.$.wtfMbsId;

                    if (self.$stage.PARAMETER().mode == 'admin' && afterEffect && id) {

                        design.set('localImage', '/bims/v1/designs/' + id + '.orig');
                        configuration.computeProcessedImage({keep: true});
                    }
                })
                .exec(callback);
        }
    });
});