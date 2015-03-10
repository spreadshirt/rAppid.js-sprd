define(["sprd/manager/IDesignConfigurationManager", 'sprd/util/UnitUtil', "sprd/model/Design", "flow", "sprd/entity/Size"], function (Base, UnitUtil, Design, flow, Size) {
    return Base.inherit("sprd.manager.DesignConfigurationManager", {
        initializeConfiguration: function (configuration, callback) {

            var content = configuration.$$ || {},
                designReference = content.design,
                svg = content.svg,
                printType = configuration.$.printType,
                printArea,
                design;

            if (svg) {
                var designId;

                if (designReference && designReference.href) {
                    designId = designReference.href.split("/").pop()
                }

                designId = designId || svg.image.designId;
                if (designId) {
                    design = configuration.$context.$contextModel.$context.createEntity(Design, designId);
                }
            } else {
                design = configuration.$.design;
            }

            flow()
                .par(function (cb) {

                    if (design) {
                        design.fetch(null, cb);
                    } else {
                        cb();
                    }

                }, function (cb) {
                    printType.fetch(null, cb);
                })
                .seq(function () {
                    if (content.printArea) {
                        printArea = configuration.$context.$contextModel.$.productType.getPrintAreaById(content.printArea.$.id);
                    } else {
                        printArea = configuration.$.printArea;
                    }
                })
                .seq(function () {
                    configuration.set({
                        design: design,
                        printArea: printArea
                    });
                })
                .seq(function () {
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

                        designColors.each(function (designColor) {
                            var closestPrintColor = printType.getClosestPrintColor(designColor.$["default"]);
                            printColors.push(closestPrintColor);
                            defaultPrintColors.push(closestPrintColor);
                        });

                        configuration.$defaultPrintColors = defaultPrintColors;
                    }

                    configuration.$.printColors.reset(printColors);
                })
                .seq(function () {

                    if (svg) {
                        var size;
                        if (design) {
                            size = UnitUtil.convertSizeToMm(design.$.size, configuration.$.printType.$.dpi);
                        } else if(configuration.$.generatedWidth){
                            // here we have a special text configuration
                            // with a generated image width
                            size = UnitUtil.convertSizeToMm(new Size({width: configuration.$.generatedWidth, height: svg.image.height / svg.image.width * configuration.$.generatedWidth, unit: "px"}), configuration.$.printType.$.dpi);
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
                .exec(callback);


        }
    });
});