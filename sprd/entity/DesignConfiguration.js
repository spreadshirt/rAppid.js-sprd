define(['sprd/entity/Configuration', 'sprd/entity/Size', 'sprd/util/UnitUtil', 'sprd/model/Design', "sprd/entity/PrintTypeColor", "underscore", "sprd/model/PrintType", "sprd/util/ProductUtil", "js/core/List", "flow"], function (Configuration, Size, UnitUtil, Design, PrintTypeColor, _, PrintType, ProductUtil, List, flow) {
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

            _designColors: "{design.colors}",
            _designCommission: "{design.price}"
        },

        initSchema: {
            design: function(design, key, cb){
                var designModel = this.$context.$contextModel.$context.createEntity(Design,design);
                designModel.fetch(null, cb);
            },
            printType: function(printType, key, cb){
                printType.fetch(null, cb);
            },
            printArea: function(printArea, key, cb){
                cb(null, this.$context.$contextModel.$.productType.getPrintAreaById(this.$$.printArea.$.id));
            }
        },

        ctor: function () {
            this.$sizeCache = {};

            this.callBase();
        },

        _commit_designColors: function (designColors) {
            if (!this.$entityInitialized) {
                return;
            }
            var printType = this.$.printType;

            // set print colors
            var printColors = [];
            var defaultPrintColors = [];

            if (designColors && printType._fetch.state === 2) {
                designColors.each(function (designColor) {
                    var closestPrintColor = printType.getClosestPrintColor(designColor.$["default"]);
                    printColors.push(closestPrintColor);
                    defaultPrintColors.push(closestPrintColor);
                });

                this.$defaultPrintColors = defaultPrintColors;

                this.$.printColors.reset(printColors);
                this.$hasDefaultColors = true;
            }

        },

        _commitPrintType: function (printType) {
            if (!this.$entityInitialized) {
                return;
            }
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


        hasDefaultColors: function () {
            return this.$hasDefaultColors;
        },

        getPrintColorsAsRGB: function () {
            var ret = [];

            // go in the direction of the layers of the design
            for (var i = 0; i < this.$.design.$.colors.$items.length; i++) {
                var designColor = this.$.design.$.colors.$items[i];
                var printColor = this.$.printColors.$items[i];
                ret[designColor.$.layer] = printColor.color().toRGB().toHexString();
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

            this.$hasDefaultColors = _.isEqual(printColors, this.$defaultPrintColors);

            this.$.printColors.reset(printColors);

            this.trigger('configurationChanged');
            this.trigger("priceChanged");
        },

        size: function () {
            if (this.$.design && this.$.design.$.size && this.$.printType && this.$.printType.$.dpi) {
                var dpi = this.$.printType.$.dpi;
                if (!this.$sizeCache[dpi]) {
                    this.$sizeCache[dpi] = UnitUtil.convertSizeToMm(this.$.design.$.size, dpi);
                }

                return this.$sizeCache[dpi];
            }

            return Size.empty;
        }.onChange("_dpi", "design"),

        // TODO: add onchange for design.restriction.allowScale
        isScalable: function () {
            return this.get("printType.isScalable()") && this.get("design.restrictions.allowScale");
        }.onChange("printType"),

        _validatePrintTypeSize: function (printType, width, height, scale) {
            this.callBase();

            if (!printType || !scale) {
                return;
            }

            this._setError("minBounds", !printType.isShrinkable() && Math.min(Math.abs(scale.x), Math.abs(scale.y)) * 100 < (this.get("design.restrictions.minimumScale")));

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
                price.add((usedPrintColors[i]).get("price"));
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

            ret.restrictions = {
                changeable: true
            };

            return ret;
        },
        parse: function (data) {
            data = this.callBase();

            if (data.designs) {
//                data.design = data.designs[0];
            }
            data.designs = undefined;

            if(data.printArea){
                // remove printArea from payload since it is the wrong one
                data.printArea = null;
            }

            if (data.content) {
                this.$$.design = data.content.svg.image.designId;

                var transformations = data.content.svg.image.transform.match(/\w+\([^)]+\)/ig),
                    transformation,
                    type, values;

                if (transformations) {
                    for (var i = 0; i < transformations.length; i++) {
                        transformation = transformations[i];
                        type = transformation[1];
                        values = transformation[2].split(",");
                        if (type === "rotate") {
                            data.rotation = parseInt(values.shift());
                        } else if (type === "scale") {
                            var scale = values;
                            data.scale = {
                                x: parseInt(scale[0]),
                                y: parseInt(scale[1])
                            }
                        }
                    }
                }

            }

            return data;
        }
    });
});