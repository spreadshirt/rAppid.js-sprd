define(['sprd/entity/Configuration', "flow", 'sprd/entity/Size', 'underscore', 'sprd/model/PrintType', "sprd/entity/PrintTypeColor", "sprd/util/ProductUtil",'js/core/Bus', 'sprd/util/UnitUtil', 'sprd/type/Style'], function (Configuration, flow, Size, _, PrintType, PrintTypeColor, ProductUtil, Bus, UnitUtil, Style) {
    return Configuration.inherit('sprd.entity.TextConfiguration', {
        defaults: {
            textArea: null,
            textFlow: null,
            composedTextFlow: null,
            selection: null
        },

        inject: {
            composer: "composer",
            bus: Bus,
            ApplyStyleToElementOperation: "ApplyStyleToElementOperation"
        },

        type: "text",

        init: function (callback) {

            var self = this,
                $$ = self.$$,
//                svg = $$.svg,
                printType = this.$.printType,
                printArea;

            flow()
                .seq(function (cb) {
                    printType.fetch(null, cb);
                })
                .seq(function () {
                    if ($$ && $$.printArea) {
                        printArea = self.$context.$contextModel.$.productType.getPrintAreaById($$.printArea.$.id);
                    } else {
                        printArea = self.$.printArea;
                    }
                })
                .seq(function () {
                    if (!self.textArea) {

                        var size = printArea.get("defaultBox") || printArea.get("boundary.size");

                        self.set("textArea", new Size({
                            width: self.get(size, "width"),
                            height: self.get(size, "height")
                        }));
                    }
                })
                .exec(callback);
        },

        _postConstruct: function () {
            this.bind("textFlow", "operationComplete", this._composeText, this);
            this._composeText();
        },

        _preDestroy: function () {
            this.unbind("textFlow", "operationComplete", this._composeText, this);
        },

        _composeText: function () {

            var textFlow = this.$.textFlow;
            if (!textFlow) {
                return;
            }

            var composer = this.$.composer,
                self = this;
            composer.compose(textFlow, this.$.textArea.$, function (err, composedTextFlow) {

                if (composedTextFlow) {
                    self.$.textArea.set('height', composedTextFlow.composed.getHeight());
                    self.trigger("sizeChanged");
                }

                self.set('composedTextFlow', composedTextFlow);

            });
        },

        _validatePrintTypeSize: function (printType, width, height, scale) {

            var ret = this.callBase();

            if (!printType || !scale) {
                return ret;
            }

            var fontToSmall = false;

            var textFlow = this.$.textFlow;

            if (textFlow) {

                var leaf = textFlow.getFirstLeaf();
                do {
                    var style = leaf.get("style");

                    if (style && style.$.fontSize && style.$.font) {
                        var fontSize = (style.$.fontSize || 0) * scale.x;
                        if (fontSize < style.$.font.$.minimalSize) {
                            fontToSmall = true;
                            break;
                        }
                    }

                } while ((leaf = leaf.getNextLeaf(textFlow)));

            }

            ret.minBound = fontToSmall;

            return ret;

        },

        _commitPrintType: function (printType) {
            // print type changed -> convert colors

            if (!printType) {
                return;
            }

            var textFlow = this.$.textFlow;
            if (textFlow) {

                var useThisColor = null;

                var leaf = textFlow.getFirstLeaf();

                do {
                    var style = leaf.get("style");

                    if (style && style.$.printTypeColor) {
                        var printTypeColor = style.$.printTypeColor;

                        if (printType.$.id === PrintType.Mapping.SpecialFlex) {
                            // convert all colors to the first one
                            useThisColor = printType.getClosestPrintColor(printTypeColor.color());
                        }

                        style.set('printTypeColor', useThisColor || printType.getClosestPrintColor(printTypeColor.color()));
                    }
                } while ((leaf = leaf.getNextLeaf(textFlow)));

            }

            this.trigger("priceChanged");
            this.trigger('configurationChanged');
        },

        price: function () {

            var usedPrintColors = [],
                price = this.callBase();

            var textFlow = this.$.textFlow;
            if (textFlow) {

                var leaf = textFlow.getFirstLeaf();

                do {
                    var style = leaf.get("style");

                    if (style && style.$.printTypeColor) {
                        var printTypeColor = style.$.printTypeColor;
                        if (_.indexOf(usedPrintColors, printTypeColor) === -1) {
                            usedPrintColors.push(printTypeColor);
                        }
                    }
                } while ((leaf = leaf.getNextLeaf(textFlow)));

                for (var i = 0; i < usedPrintColors.length; i++) {
                    if (usedPrintColors[i]) {
                        price.add((usedPrintColors[i]).get("price"));
                    }
                }

            }

            return price;

        }.on("priceChanged").onChange("_printTypePrice"),

        getUsedFonts: function () {
            var fonts = [];

            if (this.$.textFlow) {
                addFonts(this.$.textFlow);
            }

            return fonts;

            function addFonts(flowElement) {
                if (flowElement) {
                    var font = flowElement.get("style.font");

                    if (font && _.indexOf(fonts, font) === -1) {
                        fonts.push(font);
                    }

                    if (!flowElement.isLeaf) {
                        flowElement.$.children.each(function (child) {
                            addFonts(child);
                        });
                    }
                }
            }
        },

        compose: function () {
            var ret = this.callBase();

            ret.type = "text";

            ret.restrictions = {
                changeable: true
            };

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

            delete ret.printColors;

            var composedTextFlow = this.$.composedTextFlow,
                scaleX = this.$.scale.x,
                scaleY = this.$.scale.y,
                text = {
                    width: this.$.textArea.$.width * scaleX,
                    height: this.$.textArea.$.height * scaleY,
                    content: []
                };

            text.transform = transform.join(" ");

            var y = 0;

            if (composedTextFlow) {
                for (var i = 0; i < composedTextFlow.composed.children.length; i++) {
                    var paragraph = composedTextFlow.composed.children[i],
                        paragraphStyle = paragraph.item.composeStyle();

                    for (var j = 0; j < paragraph.children.length; j++) {
                        var softLine = paragraph.children[j];

                        for (var k = 0; k < softLine.children.length; k++) {

                            var line = softLine.children[k];

                            y += line.getTextHeight() * scaleY;

                            for (var l = 0; l < line.children.length; l++) {
                                var lineElement = line.children[l].item;

                                var tspan = {
                                    content: [lineElement.$.text]
                                };

                                var style = lineElement.$.style.serialize();

                                if (j === 0 && k === 0 && l === 0) {
                                    _.extend(text, style);
                                }

                                if (l === 0) {
                                    // apply paragraph style
                                    if (paragraphStyle) {
                                        _.extend(style, {
                                            textAnchor: paragraphStyle.textAnchor
                                        });
                                    }

                                    var x = 0;

                                    switch (style.textAnchor) {
                                        case "middle":
                                            x = this.$.textArea.$.width / 2;
                                            break;
                                        case "end":
                                            x = this.$.textArea.$.width;
                                    }

                                    style.x = x;
                                    style.y = y;

                                }

                                style.fontSize = (style.fontSize || 0) * scaleY;

                                _.extend(tspan, style);
                                text.content.push(tspan);

                            }

                            y += (line.getHeight() - line.getTextHeight()) * scaleY;

                        }
                    }
                }
            }

            ret.content = {
                dpi: "25.4",
                unit: "mm",
                svg: {
                    text: text
                }
            };

            return ret;
        },

        setColor: function (layerIndex, color) {
            if(this.$.ApplyStyleToElementOperation){
                var selection = this.$.selection;
                if (selection.$.anchorIndex === selection.$.activeIndex) {
                    selection = selection.clone();
                    selection.set({
                        anchorIndex: 0,
                        activeIndex: this.$.textFlow.textLength() - 1
                    })

                }
                new this.$.ApplyStyleToElementOperation(selection, this.$.textFlow, new Style({printTypeColor: color})).doOperation();
            }


            this.trigger('configurationChanged');
            this.trigger("priceChanged");
        },

        getPossiblePrintTypes: function (appearance) {
            var ret = [],
                printArea = this.$.printArea,
                textFlow = this.$.textFlow,
                selection = this.$.selection;

            if (printArea && appearance && textFlow && selection) {
                var leaf = textFlow.findLeaf(selection.$.absoluteStart),
                    lastLeaf = textFlow.findLeaf(selection.$.absoluteEnd);

                if(leaf){
                    do {
                        if(leaf.$.style && leaf.$.style.$.font){
                        ret = ret.concat(ProductUtil.getPossiblePrintTypesForTextOnPrintArea(leaf.$.style.$.font.getFontFamily(), printArea, appearance.$.id));
                        }
                        leaf = leaf.getNextLeaf();
                    } while(leaf !== null && leaf !== lastLeaf);
                }
            }

            return ret;
        }.onChange("printArea", "design"),

        size: function () {
            return this.$.textArea || Size.empty;
        }.onChange("textArea").on("sizeChanged"),

        clone: function (options) {
            options = options || {};
            options.exclude = options.exclude || [];

            options.exclude.push("bus", "composer", "composedTextFlow");

            return this.callBase(options);

        }
    });
});