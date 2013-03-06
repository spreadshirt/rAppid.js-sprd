define(["sprd/manager/IDesignConfigurationManager", 'sprd/util/UnitUtil', "sprd/model/Design"], function (Base, UnitUtil, Design) {
    return Base.inherit("sprd.manager.DesignConfigurationManager", {
        initializeConfiguration: function (configuration, callback) {

            var $$ = configuration.$$,
                svg = $$.svg,
                printType = configuration.$.printType,
                printArea,
                design;

            if (svg) {
                design = configuration.$context.$contextModel.$context.createEntity(Design, svg.image.designId);
            } else {
                design = configuration.$.design;
            }

            flow()
                .par(function (cb) {
                    design.fetch(null, cb);
                }, function (cb) {
                    printType.fetch(null, cb);
                })
                .seq(function () {
                    if ($$.printArea) {
                        printArea = configuration.$context.$contextModel.$.productType.getPrintAreaById($$.printArea.$.id);
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
                        designColors = design.$.colors,
                        values, i,
                        colorsSet = false,
                        printColor;

                    if (svg) {

                        var key,
                            method;

                        if (svg.image.hasOwnProperty("printColorIds")) {
                            key = "printColorIds";
                            method = "getPrintColorById";
                        } else {
                            key = "printColorRGBs";
                            method = "getClosestPrintColor";
                        }

                        if (svg.image[key]) {
                            values = svg.image[key].split(" ");
                            for (i = 0; i < values.length; i++) {
                                printColors.push(printType[method](values[i]));
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
                            }
                        }
                    } else if (designColorsRGBs && designColorsRGBs.length) {
                        colorsSet = true;

                        for (i = 0; i < designColorsRGBs.length; i++) {
                            printColor = printType.getClosestPrintColor(designColorsRGBs[i]);
                            printColors.push(printColor);
                            if (!printColor) {
                                colorsSet = false;
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

                        var size = UnitUtil.convertSizeToMm(design.$.size, configuration.$.printType.$.dpi);

                        var match,
                            type,
                            values,
                            ret = {
                                scale: {
                                    x: svg.image.width / size.$.width,
                                    y: svg.image.height / size.$.height
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

                        configuration.set(ret);
                    }
                })
                .exec(callback);


        }
    });
});