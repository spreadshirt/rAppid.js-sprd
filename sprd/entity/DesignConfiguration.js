define(['sprd/entity/Configuration', 'sprd/entity/Size', 'sprd/util/UnitUtil', 'sprd/model/Design', "sprd/entity/PrintTypeColor", "underscore", "sprd/model/PrintType", "sprd/util/ProductUtil", "js/core/List", "flow"], function (Configuration, Size, UnitUtil, Design, PrintTypeColor, _, PrintType, ProductUtil, List, flow) {

    var undefined;

    return Configuration.inherit('sprd.model.DesignConfiguration', {

        schema: {
            type: String,
            content: Object,
            design: Design,
            restrictions: Object
        },

        defaults: {
            type: 'design',
            _dpi: "{printType.dpi}",

            design: null,

            _designCommission: "{design.price}",
            _allowScale: "{design.restrictions.allowScale}"
        },

        ctor: function () {
            this.$sizeCache = {};
            this.$$ = {};
            this.callBase();
        },

        type: "design",

        _commitPrintType: function (printType) {
            // print type changed -> convert colors

            if (!printType || !printType.get('restrictions.colorSpace')) {
                return;
            }

            var colors = [],
                printColors = this.$.printColors;

            printColors.each(function (printColor) {
                colors.push(printType.getClosestPrintColor(printColor.color()));
            });

            if (printType.$.id === PrintType.Mapping.SpecialFlex) {
                // convert all colors to the first one
                for (var i = 1; i < colors.length; i++) {
                    colors[i] = colors[0];
                }
            }

            printColors.reset(colors);
            this.trigger('configurationChanged');
            this.trigger("priceChanged");
        },

        getPrintColorsAsRGB: function () {
            var ret = [];

            if (this.$.design.$.colors.size() === this.$.printColors.size()) {
                // go in the direction of the layers of the design
                for (var i = 0; i < this.$.design.$.colors.$items.length; i++) {
                    var designColor = this.$.design.$.colors.$items[i];
                    var printColor = this.$.printColors.$items[i];
                    ret[designColor.$.layer] = printColor.color().toRGB().toHexString();
                }
            }

            return ret;
        },

        setColor: function (layerIndex, color) {
            var printType = this.$.printType;

            if (!(color instanceof PrintTypeColor)) {
                color = printType.getClosestPrintColor(color);
            }

            if (!printType.containsPrintTypeColor(color)) {
                throw new Error("Color not contained in print type");
            }

            var printColors = this.$.printColors.$items;

            if (printColors[layerIndex] === color) {
                return;
            }

            printColors.splice(layerIndex, 1, color);

            if (printType.$.id === PrintType.Mapping.SpecialFlex) {
                // convert all other layers to the new color
                for (var i = 0; i < printColors.length; i++) {
                    if (i !== layerIndex) {
                        printColors[i] = printColors[layerIndex];
                    }
                }
            }

            this.$.printColors.reset(printColors);

            this.trigger('configurationChanged');
            this.trigger("priceChanged");
        },

        size: function () {
            return this.getSizeForPrintType(this.$.printType);
        }.onChange("_dpi", "design"),

        getSizeForPrintType: function (printType) {
            if (this.$.design && this.$.design.$.size && printType && printType.$.dpi) {
                var dpi = printType.$.dpi;
                if (!this.$sizeCache[dpi]) {
                    this.$sizeCache[dpi] = UnitUtil.convertSizeToMm(this.$.design.$.size, dpi);
                }

                return this.$sizeCache[dpi];
            }

            return Size.empty;
        },

        // TODO: add onchange for design.restriction.allowScale
        isScalable: function () {
            return this.get("printType.isScalable()") && this.$._allowScale;
        }.onChange("printType", "_allowScale"),

        allowScale: function () {
            return this.$._allowScale;
        },

        _validatePrintTypeSize: function (printType, width, height, scale) {
            var ret = this.callBase();

            if (!printType || !scale) {
                return ret;
            }

            ret.minBound = !printType.isShrinkable() && Math.min(Math.abs(scale.x), Math.abs(scale.y)) * 100 < (this.get("design.restrictions.minimumScale"));

            return ret;

        },

        price: function () {

            var usedPrintColors = [],
                price = this.callBase();

            this.$.printColors.each(function (printColor) {
                if (_.indexOf(usedPrintColors, printColor) === -1) {
                    usedPrintColors.push(printColor);
                }
            });

            for (var i = 0; i < usedPrintColors.length; i++) {
                if (usedPrintColors[i]) {
                    price.add((usedPrintColors[i]).get("price"));
                }
            }

            price.add(this.get('_designCommission'));

            return price;

        }.on("priceChanged").onChange("_designCommission", "_printTypePrice"),

        getPossiblePrintTypes: function (appearance) {
            var ret = [],
                printArea = this.$.printArea,
                design = this.$.design;

            if (printArea && appearance && design) {
                ret = ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(design, printArea, appearance.$.id);
            }

            return ret;
        }.onChange("printArea", "design"),

        compose: function () {
            var ret = this.callBase();

            var transform = [],
                scale = this.$.scale,
                rotation = this.$.rotation,

                width = this.width(),
                height = this.height();

            if (rotation) {
                transform.push("rotate(" + rotation + "," + Math.round(width / 2, 3) + "," + Math.round(height / 2, 3) + ")");
            }

            if (scale && (scale.x < 0 || scale.y < 0)) {
                transform.push("scale(" + (scale.x < 0 ? -1 : 1) + "," + (scale.y < 0 ? -1 : 1) + ")");
            }

            var designId = this.$.design.$.wtfMbsId;
            ret.content = {
                unit: "mm",
                dpi: "25.4",
                svg: {
                    image: {
                        transform: transform.join(" "),
                        width: Math.round(width, 3),
                        height: Math.round(height, 3),
                        designId: designId
                    }
                }
            };

            delete ret.design;

            var printColorIds = [],
                printColorRGBs = [];

            this.$.printColors.each(function (printColor) {
                printColorIds.push(printColor.$.id);
                printColorRGBs.push(printColor.color().toString())
            });

            if (this.$.printType.isPrintColorColorSpace()) {
                ret.content.svg.image.printColorIds = printColorIds.join(" ");
            } else {
                ret.content.svg.image.printColorRGBs = printColorRGBs.join(" ");
            }

            ret.printColors = undefined;

            ret.restrictions = {
                changeable: true
            };

            return ret;
        },
        parse: function (data) {
            data = this.callBase();

            data.designs = undefined;

            if (data.printArea) {
                // remove printArea from payload since it is the wrong one
                // it will be set within the initSchema methods
                this.$$.printArea = data.printArea;
                data.printArea = null;
            }

            if (data.content) {
                this.$$.svg = data.content.svg;
            }

            return data;
        },

        init: function (callback) {

            var self = this,
                $$ = self.$$,
                svg = $$.svg,
                printType = this.$.printType,
                printArea,
                design;

            if (svg) {
                design = this.$context.$contextModel.$context.createEntity(Design, svg.image.designId);
            } else {
                design = this.$.design;
            }

            flow()
                .par(function (cb) {
                    design.fetch(null, cb);
                }, function (cb) {
                    printType.fetch(null, cb);
                })
                .seq(function () {
                    if ($$.printArea) {
                        printArea = self.$context.$contextModel.$.productType.getPrintAreaById($$.printArea.$.id)
                    } else {
                        printArea = self.$.printArea;
                    }
                })
                .seq(function () {
                    self.set({
                        design: design,
                        printArea: printArea
                    })
                })
                .seq(function () {
                    var printType = self.$.printType;

                    // set print colors
                    var printColors = [],
                        defaultPrintColors = [],
                        designColorsRGBs = self.$.designColorRGBs,
                        designColorIds = self.$.designColorIds,
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

                        self.$defaultPrintColors = defaultPrintColors;
                    }

                    self.$.printColors.reset(printColors);
                })
                .seq(function () {

                    if (svg) {

                        var size = UnitUtil.convertSizeToMm(design.$.size, self.$.printType.$.dpi);

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
                        while (match = regExp.exec(svg.image.transform)) {
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

                        self.set(ret);
                    }
                })
                .exec(callback)

        },

        isAllowedOnPrintArea: function (printArea) {
            return printArea && printArea.get("restrictions.designAllowed") == true;
        },

        getPossiblePrintTypesForPrintArea: function (printArea, appearanceId) {
            return ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(this.$.design, printArea, appearanceId);
        },

        minimumScale: function () {
            return (this.get("design.restrictions.minimumScale") || 100 ) / 100;
        }
    });
});