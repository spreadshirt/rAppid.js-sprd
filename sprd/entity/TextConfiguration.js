define(['sprd/entity/Configuration', "flow", 'sprd/entity/Size', 'underscore', 'sprd/model/PrintType', "sprd/util/ProductUtil", 'js/core/Bus', 'sprd/util/UnitUtil', 'sprd/util/ArrayUtil', "sprd/manager/ITextConfigurationManager", "js/core/List"],
    function (Configuration, flow, Size, _, PrintType, ProductUtil, Bus, UnitUtil, ArrayUtil, ITextConfigurationManager, List) {

        var copyrightWordList;

        var TextConfiguration = Configuration.inherit('sprd.entity.TextConfiguration', {
            defaults: {
                textArea: null,
                textFlow: null,
                composedTextFlow: null,
                selection: null,
                bound: null,
                copyrightWordList: null,
                isNew: false
            },

            inject: {
                composer: "composer",
                bus: Bus,
                ApplyStyleToElementOperation: "ApplyStyleToElementOperation",
                Style: "Style",
                manager: ITextConfigurationManager
            },

            type: "text",

            ctor: function (attributes) {

                attributes = attributes || {};

                _.defaults(attributes, {
                    copyrightWordList: TextConfiguration.getCopyrightWordList()
                });

                this.callBase(attributes);

                copyrightWordList.bind("add", function () {
                    this.validateText();
                }, this);
            },

            init: function (options, callback) {

                var self = this,
                    productManager = this.$.manager;

                flow()
                    .seq(function (cb) {
                        productManager.initializeConfiguration(self, options, cb);
                    })
                    .seq(function (cb) {
                        if (self.$stageRendered || (self.$stage && self.$stage.rendered)) {
                            self._composeText(false, cb);
                        } else {
                            cb();
                        }
                    })
                    .exec(callback);
            },

            _postConstruct: function () {
                this.bind("textFlow", "operationComplete", this._onTextFlowChange, this);
                this._composeText();
            },

            _preDestroy: function () {
                this.unbind("textFlow", "operationComplete", this._onTextFlowChange, this);
            },

            bus_StageRendered: function () {
                this.$stageRendered = true;
                this._composeText();
            }.bus("Stage.Rendered"),

            _commitChangedAttributes: function ($, options) {
                if ($.hasOwnProperty("bound") && !options.preventValidation && !options.printTypeEqualized) {
                    this._setError(this._validateTransform($));
                }

                this.callBase();
            },

            _commitTextFlow: function(textFlow) {

                var rawText = null;
                if (textFlow) {
                    rawText = textFlow.text();
                }

                this.set("rawText", rawText);
            },

            _onTextFlowChange: function (e) {
                var self = this;

                this.validateText();

                this._composeText(false, function () {
                    self._debounceFunctionCall(function () {
                        self.$.bus && self.$.bus.trigger('Application.productChanged', null, self);
                    }, "productChanged", 300);
                });

                if (e && e.$ && e.$.operation && e.$.operation.$text) {
                    // if there was a text change, handle it as configuration is not new anymore
                    this.set('isNew', false);
                }


                this.trigger("priceChanged");
                this.trigger("configurationChanged");

                var rawText = this.$.textFlow.text();
                if (this.$.rawText && this.$.rawText != rawText) {
                    this.trigger("rawTextChanged");
                }

                this.set("rawText", rawText);

            },

            _debouncedComposeText: function () {
                this._debounceFunctionCall(this._composeText, "composeText", 300, this, [true])
            },

            _composeText: function (skipHeight, options, callback) {

                if (!(this.$stage && this.$stage.rendered)) {
                    return;
                }

                if (options instanceof Function) {
                    callback = options;
                    options = null;
                }

                options = options || {};

                var textFlow = this.$.textFlow;
                if (!textFlow) {
                    return;
                }
                var textArea = this.$.textArea;

                if (!textArea) {
                    return;
                }

                var composer = this.$.composer,
                    self = this;

                composer.compose(textFlow, textArea.$, function (err, composedTextFlow) {

                    if (composedTextFlow && !skipHeight) {
                        self.$.textArea.set('height', composedTextFlow.composed.getHeight());
                        self.trigger("sizeChanged");
                    }

                    var opt = _.clone(options);
                    opt.force = true;
                    self.set({
                        composedTextFlow: composedTextFlow,
                        bound: composedTextFlow ? composedTextFlow.measure : null
                    }, opt);

                    callback && callback(err);
                });
            },

            validateText: function () {
                this._debounceFunctionCall(this._validateText, "validateText", 300);
            },

            _validateText: function () {
                var textFlow = this.$.textFlow,
                    badWord;

                if (textFlow && copyrightWordList && copyrightWordList.size()) {
                    var text = (textFlow.text() || "").toLowerCase();

                    if (text.length > 1) {
                        // check that we don't contain copyright content
                        badWord = copyrightWordList.find(function (word) {
                            return text.indexOf(word.toLowerCase()) !== -1;
                        });
                    }
                }

                this._setError("copyright", badWord);
            },

            _validatePrintTypeSize: function (printType, width, height, scale) {

                var bound = this.$.bound;

                var ret = this.callBase(printType, bound ? bound.width * scale.x : width, bound ? bound.height * scale.y : height, scale);

                if (!printType || !scale) {
                    return ret;
                }

                var fontToSmall = false;

                var textFlow = this.$.textFlow;

                if (textFlow && !printType.isShrinkable()) {

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

            _getBoundingBox: function (offset, width, height, rotation, scale, onlyContent) {

                var bound = this.$.bound;

                if (bound && onlyContent) {
                    offset = offset || this.$.offset;
                    offset = offset.clone();
                    scale = scale || this.$.scale;

                    width = bound.width * scale.x;
                    height = bound.height * scale.y;

                    offset.set({
                        x: offset.$.x + bound.x * scale.x,
                        y: offset.$.y + bound.y * scale.y
                    });

                    var scaleFactor = scale.x;

                    var distance = -(this.width(scaleFactor) - bound.width * scaleFactor) / 2 + bound.x * scaleFactor;
                    return this.callBase(offset, width, height, rotation, scale, onlyContent, distance);

                } else {
                    return this.callBase(offset, width, height || this.$.maxHeight, rotation, scale, onlyContent);
                }


            },

            _commitPrintType: function (printType, oldPrintType, options) {
                // print type changed -> convert colors

                if (!printType) {
                    return;
                }

                var textFlow = this.$.textFlow,
                    printColors = [],
                    printColor;
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

                            printColor = useThisColor || printType.getClosestPrintColor(printTypeColor.color());
                            if (!printColors.length) {
                                printColors = [printColor];
                            }

                            style.set('printTypeColor', printColor);
                        }
                    } while ((leaf = leaf.getNextLeaf(textFlow)));

                    this.$.printColors.reset(printColors);
                    this._composeText(true, options);
                }

                this.trigger("priceChanged");
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

                var y = 0,
                    extendedStyleToText = false;

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
                                        content: [lineElement.$.text],
                                        lineWidth: text.width
                                    };

                                    var style = lineElement.$.style.serialize();
                                    style.fontSize = (style.fontSize || 0) * scaleY;


                                    if (!extendedStyleToText) {
                                        _.extend(text, style);
                                        extendedStyleToText = true;
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
                                                x = text.width / 2;
                                                break;
                                            case "end":
                                                x = text.width;
                                        }

                                        style.x = x;
                                        style.y = y;

                                    }

                                    _.extend(tspan, style);
                                    text.content.push(tspan);

                                }

                                y += (line.getHeight() - line.getTextHeight()) * scaleY;

                            }
                        }
                    }
                } else {
                    throw new Error("No composed text flow");
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
                if (this.$.ApplyStyleToElementOperation && this.$.Style) {
                    var selection = this.$.selection;
                    if (selection.$.anchorIndex === selection.$.activeIndex) {
                        selection = selection.clone();
                        selection.set({
                            anchorIndex: 0,
                            activeIndex: this.$.textFlow.textLength() - 1
                        })

                    }
                    new this.$.ApplyStyleToElementOperation(selection, this.$.textFlow, new this.$.Style({printTypeColor: color})).doOperation();

                    this.$.printColors.reset([color]);
                }

            },

            getPossiblePrintTypes: function (appearance) {
                var ret = [],
                    tmp,
                    printArea = this.$.printArea,
                    textFlow = this.$.textFlow,
                    selection = this.$.selection;

                if (printArea && appearance && textFlow && selection) {
                    var leaf = textFlow.findLeaf(selection.$.absoluteStart),
                        lastLeaf = textFlow.findLeaf(selection.$.absoluteEnd);

                    if (leaf) {
                        do {
                            if (leaf.$.style && leaf.$.style.$.font) {
                                tmp = ProductUtil.getPossiblePrintTypesForTextOnPrintArea(leaf.$.style.$.font.getFontFamily(), printArea, appearance.$.id);
                                _.each(tmp, function (element) {
                                    if (ret.indexOf(element) === -1) {
                                        ret.push(element);
                                    }
                                });
                            }
                            leaf = leaf.getNextLeaf();
                        } while (leaf !== null && leaf !== lastLeaf);
                    }
                }

                return ret;
            }.onChange("printArea", "design"),

            getPossiblePrintTypesForPrintArea: function (printArea, appearanceId) {

                var fontFamilies = [],
                    printTypes = [];

                var textFlow = this.$.textFlow;
                if (textFlow) {

                    var leaf = textFlow.getFirstLeaf();

                    do {
                        var style = leaf.get("style");

                        if (style && style.$.font && _.indexOf(fontFamilies, style.$.font.getFontFamily()) === -1) {
                            fontFamilies.push(style.$.font.getFontFamily());
                        }
                    } while ((leaf = leaf.getNextLeaf(textFlow)));
                }

                for (var i = 0; i < fontFamilies.length; i++) {
                    printTypes.push(ProductUtil.getPossiblePrintTypesForTextOnPrintArea(fontFamilies[i], printArea, appearanceId));
                }

                return ArrayUtil.average.apply(ArrayUtil, printTypes);

            },

            parse: function (data) {

                data = this.callBase();

                this.$$ = this.$$ || {};

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

            getSizeForPrintType: function (printType) {
                return this.size();
            },

            size: function () {
                return this.$.textArea || Size.empty;
            }.onChange("textArea").on("sizeChanged"),

            clone: function (options) {
                options = options || {};
                options.exclude = options.exclude || [];

                options.exclude.push("bus", "composer", "textArea", "composedTextFlow");

                var ret = this.callBase(options);
                ret.$stage = this.$stage;
                ret.$.composedTextFlow = null;
                return ret;
            },

            sync: function () {
                this.$stage = this._$source.$stage;
                return this.callBase();
            },

            isAllowedOnPrintArea: function (printArea) {
                return printArea && printArea.get("restrictions.textAllowed") == true;
            },

            isReadyForCompose: function () {
                return !!this.$.composedTextFlow;
            },
            isDeepEqual: function (b) {
                var comparableProperties = ['offset', 'rotation', 'printType', 'printColors', 'scale', 'printArea'],
                    i,
                    property,
                    originalProperty,
                    newProperty;

                for (i = comparableProperties.length; i--;) {
                    property = comparableProperties[i];
                    newProperty = this.$[property];
                    originalProperty = b.$[property];

                    if (this.$.hasOwnProperty(property)) {
                        if (newProperty === null && originalProperty !== null) {
                            return false;
                        } else if (newProperty !== null && originalProperty === null) {
                            return false;
                        } else if (newProperty.isDeepEqual && newProperty.isDeepEqual instanceof Function) {
                            if (!newProperty.isDeepEqual(originalProperty)) {
                                return false;
                            }
                        } else if (_.isObject(newProperty)) {
                            if (!_.isEqual(originalProperty, newProperty)) {
                                return false;
                            }
                        } else {
                            if (newProperty !== originalProperty) {
                                return false;
                            }
                        }
                    }
                }

                if (this.$.textFlow === null && b.$.textFlow === null) {
                    return true;
                } else if (this.$.textFlow) {
                    return this.$.textFlow.isDeepEqual(b.$.textFlow);
                }
                return false;
            }

        }, {

            getCopyrightWordList: function () {
                copyrightWordList = copyrightWordList || new List();
                return copyrightWordList;
            }

        });


        return TextConfiguration;
    });