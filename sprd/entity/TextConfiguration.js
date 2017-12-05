define(['sprd/entity/Configuration', "flow", 'sprd/entity/Size', 'underscore', 'sprd/model/PrintType', "sprd/util/ProductUtil", 'js/core/Bus', 'sprd/util/UnitUtil', 'sprd/util/ArrayUtil', "sprd/manager/ITextConfigurationManager", "js/core/List", "xaml!sprd/view/svg/TextConfigurationMeasureRenderer"],
    function(Configuration, flow, Size, _, PrintType, ProductUtil, Bus, UnitUtil, ArrayUtil, ITextConfigurationManager, List, TextMeasureRenderer) {

        var copyrightWordList;

        if (!String.prototype.codePointAt) {
            (function() {
                'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
                var codePointAt = function(position) {
                    if (this == null) {
                        throw TypeError();
                    }
                    var string = String(this);
                    var size = string.length;
                    // `ToInteger`
                    var index = position ? Number(position) : 0;
                    if (index != index) { // better `isNaN`
                        index = 0;
                    }
                    // Account for out-of-bounds indices:
                    if (index < 0 || index >= size) {
                        return undefined;
                    }
                    // Get the first code unit
                    var first = string.charCodeAt(index);
                    var second;
                    if ( // check if it’s the start of a surrogate pair
                    first >= 0xD800 && first <= 0xDBFF && // high surrogate
                    size > index + 1 // there is a next code unit
                    ) {
                        second = string.charCodeAt(index + 1);
                        if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
                            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                            return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
                        }
                    }
                    return first;
                };
                if (Object.defineProperty) {
                    Object.defineProperty(String.prototype, 'codePointAt', {
                        'value': codePointAt,
                        'configurable': true,
                        'writable': true
                    });
                } else {
                    String.prototype.codePointAt = codePointAt;
                }
            }());
        }


        var TextConfiguration = Configuration.inherit('sprd.entity.TextConfiguration', {
            defaults: {
                textArea: null,
                textFlow: null,
                composedTextFlow: null,
                selection: null,
                bound: null,
                copyrightWordList: null,
                isNew: false,
                isTemplate: false,
                autoGrow: false,
                measurer: null,
                textChanged: null,
                alignmentMatters: null,
                initialized: null,
                initOptions: null
            },

            inject: {
                composer: "composer",
                bus: Bus,
                ApplyStyleToElementOperation: "ApplyStyleToElementOperation",
                Style: "Style",
                manager: ITextConfigurationManager
            },

            type: "text",
            representationType: "text",

            ctor: function() {
                this.callBase();

                copyrightWordList.bind("add", function() {
                    this.validateText();
                }, this);
            },

            init: function(options, callback) {

                var self = this,
                    textConfigurationManager = this.$.manager,
                    initialized = this.$.initialized,
                    stageReady = self.$stage && self.$stage.rendered;

                if (initialized || !stageReady) {
                    this.set("initOptions", options);
                    callback && callback(null);
                    return;
                }

                options = options || this.get("initOptions");

                var oldTextArea = {};

                flow()
                    .seq(function(cb) {
                        textConfigurationManager.initializeConfiguration(self, options, cb);
                    })
                    .seq(function(cb) {
                        oldTextArea.width = self.get("textArea.width");
                        oldTextArea.height = self.get("textArea.height");
                        self._composeText(false, cb);
                    })
                    .seq(function() {
                        var newTextArea = self.get("textArea");

                        if (oldTextArea.width && oldTextArea.height && newTextArea) {
                            self.reposition(newTextArea.$.width, newTextArea.$.height, oldTextArea.width, oldTextArea.height);
                        }
                    })
                    .seq(function() {
                        var leafStyle = self.getCommonLeafStyleForWholeTextFlow(),
                            printTypeColor;


                        if (leafStyle) {
                            printTypeColor = leafStyle.get('printTypeColor');
                        }

                        self.$.printColors.reset(printTypeColor ? [printTypeColor] : []);
                        self.initMeasurer();
                    })
                    .seq(function() {
                        self.set('initialized', true);
                    })
                    .exec(callback);
            },

            initMeasurer: function() {
                if (this.$.measurer) {
                    return;
                }

                if (this.$stageRendered || (this.$stage && this.$stage.rendered)) {
                    var measureRenderer = this.$stage.createComponent(TextMeasureRenderer, {
                        configuration: this
                    });
                    this.set('measurer', measureRenderer);
                    this.$stage.addChild(measureRenderer);
                }
            },

            removeMeasurer: function() {
                if (!this.$.measurer) {
                    return;
                }
                var measurer = this.$.measurer,
                    el = measurer.$el,
                    parent = el.parentNode;

                if (parent) {
                    parent.removeChild(el);
                }

                this.set('measurer', null);
            },

            textChangedSinceCreation: function() {
                var initialText = this.$.initialText,
                    currentText = this.$.rawText,
                    textChanged = this.$.textChanged;

                if (!initialText) {
                    return true;
                }

                var result = textChanged || initialText !== currentText;
                this.set('textChanged', result);
                return result;
            },

            isOnlyWhiteSpace: function() {
                var text = this.$.rawText;
                if (!text) {
                    return true;
                }

                return /^[\s\n\r]*$/.test(text);
            },

            _postConstruct: function() {
                this.bind("textFlow", "operationComplete", this._onTextFlowChange, this);
                this._composeText();
            },

            _preDestroy: function() {
                this.unbind("textFlow", "operationComplete", this._onTextFlowChange, this);
                this.removeMeasurer();
            },

            bus_StageRendered: function() {
                this.init();
            }.bus("Stage.Rendered"),

            _commitChangedAttributes: function($, options) {
                var relevantChange = !!$.innerRect;
                if (relevantChange && !options.preventValidation && !options.printTypeEqualized) {
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

            _onTextFlowChange: function(e) {
                var self = this;

                this.validateText();

                this._composeText(false, function() {
                    self._debounceFunctionCall(function() {
                        self.$.bus && self.$.bus.trigger('Application.productChanged', null, self);
                    }, "productChanged", 300);
                });

                if (e && e.$ && e.$.operation && e.$.operation.$text) {
                    // if there was a text change, handle it as configuration is not new anymore
                    this.set('isNew', false);
                    this.set('isTemplate', false);
                }


                this.trigger("priceChanged");
                this.trigger("configurationChanged");

                var rawText = this.$.textFlow.text();
                this.set("rawText", rawText);
            },

            _debouncedComposeText: function() {
                this._debounceFunctionCall(this._composeText, "composeText", 300, this, [true])
            },

            _composeText: function(skipHeight, options, callback) {

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

                textArea.$.autoGrow = this.$.autoGrow;
                var oldMeasure = this.get('composedTextFlow.measure');

                composer.compose(textFlow, textArea.$, function(err, composedTextFlow) {

                    var opt = _.clone(options),
                        newMeasure = composedTextFlow ? composedTextFlow.measure : null;

                    opt.force = true;
                    self.set({
                        composedTextFlow: composedTextFlow,
                        alignmentMatters: composedTextFlow.alignmentMatters(),
                        bound: newMeasure
                    }, opt);


                    if (composedTextFlow) {

                        if (!textArea.$.autoGrow && !skipHeight) {
                            self.$.textArea.set('height', composedTextFlow.composed.getHeight());
                        } else if (textArea.$.autoGrow) {
                            self.$.textArea.set(composedTextFlow.measure);
                        }

                        self.trigger("sizeChanged");

                        if (self.fontChanged()) {
                            self.resize(newMeasure, oldMeasure);
                        } else {
                            var oldTextArea = self.$previousAttributes.textArea && self.$previousAttributes.textArea.$;
                            self.reposition(newMeasure, oldMeasure || oldTextArea, self.textChanged(), composedTextFlow);
                        }
                    }

                    callback && callback(err);
                });
            },

            fontSizeChanged: function(newTextFlow, oldTextFlow) {
                newTextFlow = newTextFlow || this.$.textFlow;
                oldTextFlow = oldTextFlow || this.$previousAttributes.textFlow;

                if (!newTextFlow || !oldTextFlow) {
                    return false;
                }

                var oldSizes = this.getFontSizes(oldTextFlow),
                    newSizes = this.getFontSizes(newTextFlow);

                return oldSizes.length > 0 && _.difference(newSizes, oldSizes).length > 0;
            },

            fontChanged: function(newTextFlow, oldTextFlow) {
                newTextFlow = newTextFlow || this.$.textFlow;
                oldTextFlow = oldTextFlow || this.$previousAttributes.textFlow;

                if (!newTextFlow || !oldTextFlow) {
                    return false;
                }

                var oldFonts = this.getFonts(oldTextFlow),
                    newFonts = this.getFonts(newTextFlow);

                return oldFonts.length > 0 && _.difference(newFonts, oldFonts).length > 0;
            },

            textChanged: function(newTextFlow, oldTextFlow) {
                newTextFlow = newTextFlow || this.$.textFlow;
                oldTextFlow = oldTextFlow || this.$previousAttributes.textFlow;

                if (!newTextFlow || !oldTextFlow) {
                    return false;
                }

                return newTextFlow.text() !== oldTextFlow.text();
            },

            centerConfiguration: function(newWidth, newHeight, oldWidth, oldHeight) {
                var self = this;

                if (newWidth && newWidth.width && newHeight && newHeight.width) {
                    oldWidth = newHeight.width;
                    oldHeight = newHeight.height;
                    newHeight = newWidth.height;
                    newWidth = newWidth.width;
                }

                if (!oldWidth || !oldHeight || !newWidth || !newHeight) {
                    return;
                }

                self.centerX(newWidth, oldWidth);
                self.centerY(newHeight, oldHeight);
            },

            centerX: function(newWidth, oldWidth) {
                var self = this;
                if (!newWidth || !oldWidth) {
                    return;
                }

                var widthDelta = (newWidth - oldWidth) * self.$.scale.x,
                    newX = Number(self.$.offset.get('x')) - widthDelta / 2;
                self.$.offset.set('x', newX);
            },

            centerY: function(newHeight, oldHeight) {
                var self = this;
                if (!newHeight || !oldHeight) {
                    return;
                }

                var widthDelta = (newHeight - oldHeight) * self.$.scale.y,
                    newY = Number(self.$.offset.get('y')) - widthDelta / 2;
                self.$.offset.set('y', newY);
            },

            resize: function(newWidth, newHeight, oldWidth, oldHeight) {
                if (newWidth && newWidth.width && newHeight && newHeight.width) {
                    oldWidth = newHeight.width;
                    oldHeight = newHeight.height;
                    newHeight = newWidth.height;
                    newWidth = newWidth.width;
                }

                if (!oldWidth || !oldHeight || !newWidth || !newHeight) {
                    return;
                }

                var self = this,
                    factor = oldWidth / newWidth,
                    newScaleX = self.$.scale.x * factor,
                    oldScaleY = self.$.scale.y,
                    newScaleY = oldScaleY * factor;


                self.set('scale', {x: newScaleX, y: newScaleY});

                var delta = (newHeight * newScaleY - oldHeight * oldScaleY),
                    newY = Number(self.$.offset.get('y')) - (delta) / 2;
                self.$.offset.set('y', newY);
            },

            reposition: function(newWidth, newHeight, oldWidth, oldHeight, textChange, composedTextFlow) {
                if (newWidth && newWidth.width && newHeight && newHeight.width) {
                    textChange = oldWidth;
                    composedTextFlow = oldHeight;
                    oldWidth = newHeight.width;
                    oldHeight = newHeight.height;
                    newHeight = newWidth.height;
                    newWidth = newWidth.width;
                }

                if (!oldWidth || !oldHeight || !newWidth || !newHeight) {
                    return;
                }

                if (!textChange) {
                    return this.centerConfiguration(newWidth, newHeight, oldWidth, oldHeight);
                } else if (this.$.autoGrow) {
                    return this.repositionAutoGrow(newWidth, newHeight, oldWidth, oldHeight, composedTextFlow);
                }
            },

            repositionAutoGrow: function(newWidth, newHeight, oldWidth, oldHeight, composedTextFlow) {
                var self = this;
                if (!self.$.autoGrow || !composedTextFlow || !newWidth || !oldWidth) {
                    return;
                }

                this.centerConfiguration(newWidth, newHeight, oldWidth, oldHeight);

                var widthDelta = (newWidth - oldWidth) * self.$.scale.x,
                    alignment = composedTextFlow.getAlignmentOfWidestSpan(),
                    alignmentFactor = composedTextFlow.alignmentToFactor(alignment) - 0.5,
                    rotation = this.$.rotation / 180 * Math.PI,
                    sin = Math.sin(rotation),
                    cos = Math.cos(rotation),
                    newX = Number(self.$.offset.get('x')) - (cos * widthDelta * alignmentFactor),
                    newY = Number(self.$.offset.get('y')) - (sin * widthDelta * alignmentFactor);

                self.$.offset.set({x: newX, y: newY});
            },

            validateText: function() {
                this._debounceFunctionCall(this._validateText, "validateText", 300);
            },

            _validateText: function() {
                var textFlow = this.$.textFlow,
                    text = (textFlow && textFlow.text() || "").toLowerCase(),
                    badWord;

                if (text.length > 1) {
                    // check that we don't contain copyright content
                    if (copyrightWordList && copyrightWordList.size()) {
                        badWord = copyrightWordList.find(function(word) {
                            return text.indexOf(word.toLowerCase()) !== -1;
                        });

                        this._setError("copyright", badWord);
                    }

                    this._setError("emoji", this.containsEmoji(text));
                }
            },

            // http://stackoverflow.com/questions/30757193/find-out-if-character-in-string-is-emoji
            isEmoji: function(charCode) {
                var isSpecialCharacterEmoji = charCode === 0x3030 || charCode === 0x00AE || charCode === 0x00A9,
                    inEmoticonBlock = 0x1F600 <= charCode && charCode <= 0x1F64F,
                    miscSymbolsAndPictogram = 0x1F300 <= charCode && charCode <= 0x1F5FF,
                    transportAndMap = 0x1F680 <= charCode && charCode <= 0x1F6FF,
                    miscSymbol = 0x2600 <= charCode && charCode <= 0x26FF,
                    dingbat = 0x2700 <= charCode && charCode <= 0x27BF,
                    variation = 0xFE00 <= charCode && charCode <= 0xFE0F,
                    arrow = 0x20D0 <= charCode && charCode <= 0x20FF;

                return isSpecialCharacterEmoji || miscSymbolsAndPictogram || transportAndMap || inEmoticonBlock || miscSymbol || dingbat || variation || arrow;
            },

            containsEmoji: function(string) {
                for (var i = 0; i < string.length; i++) {
                    if (this.isEmoji(string.codePointAt(i))) {
                        var foundEmoji = string.match(/[\uD83C-\uDBFF\uDC00-\uDFFF]{2}/),
                            emoji = (foundEmoji && foundEmoji[0]) || string.substring(i, i + 1);
                        return {emoji: emoji};
                    }
                }

                return false;
            },


            getParagraphStyleForWholeTextFlow: function() {
                var selection = this.$.selection,
                    textFlow = this.$.textFlow;

                var selectionClone = selection.clone();
                selectionClone.set({
                    anchorIndex: 0,
                    activeIndex: textFlow.textLength() - 1
                });

                return selectionClone.getCommonParagraphStyle(textFlow);
            },

            getCommonLeafStyleForWholeTextFlow: function() {
                var selection = this.$.selection,
                    textFlow = this.$.textFlow;

                var selectionClone = selection.clone();
                selectionClone.set({
                    anchorIndex: 0,
                    activeIndex: textFlow.textLength() - 1
                });

                return selectionClone.getCommonLeafStyle(textFlow);
            },

            setStyleOnWholeFlow: function(leafStyle, paragraphStyle) {
                var textFlow = this.$.textFlow,
                    applyOperation = this.$.ApplyStyleToElementOperation,
                    Style = this.$.Style,
                    selection = this.$.selection;

                if (textFlow && applyOperation && Style) {
                    selection = selection.clone();
                    selection.set({
                        anchorIndex: 0,
                        activeIndex: textFlow.textLength() - 1
                    });

                    if (!(leafStyle instanceof Style)) {
                        leafStyle = new Style(leafStyle)
                    }

                    if (!(paragraphStyle instanceof Style)) {
                        paragraphStyle = new Style(paragraphStyle)
                    }

                    var operation = new applyOperation(selection, textFlow, leafStyle, paragraphStyle);
                    operation.doOperation();
                }
            },

            _validatePrintTypeSize: function(printType, width, height, scale) {
                var bound = this.$.bound;
                return this.callBase(printType, bound ? bound.width * scale.x : width, bound ? bound.height * scale.y : height, scale);
            },

            getBound: function() {
                //TODO use innerRect and fallback to bound when innerRect is not there
            },

            _getMinimalScales: function(printType, predicate) {
                var textFlow = this.$.textFlow,
                    minimalScales = [];

                if (textFlow && !printType.isShrinkable()) {

                    var leaf = textFlow.getFirstLeaf();
                    do {
                        var style = leaf.get("style");

                        if (style && style.$.fontSize && style.$.font) {
                            var minimalScale = style.$.font.$.minimalSize / style.$.fontSize;
                            if (predicate) {
                                if (predicate(minimalScale)) {
                                    minimalScales.push(minimalScale);
                                    break;
                                }
                            } else {
                                minimalScales.push(minimalScale);
                            }
                        }

                    } while ((leaf = leaf.getNextLeaf(textFlow)));
                }

                return minimalScales;
            },

            minimumScale: function() {
                return this._getMinimalScale(this.$.printType);
            }.onChange('printType'),

            _getMinimalScale: function(printType) {
                return Math.max.apply(null, this._getMinimalScales(printType));
            },

            _getBoundingBox: function(offset, width, height, rotation, scale, onlyContent) {

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

            _commitPrintType: function(printType) {
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
                    this._composeText(true, {preventValidation: true});
                }

                this.trigger("priceChanged");
            },

            price: function() {

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

            getUsedFonts: function() {
                var fonts = [];

                if (this.$.textFlow) {
                    fonts = this.$.textFlow.getUsedStyleValues('font');
                }

                return fonts;
            },

            save: function(callback) {
                var composedTextFlow = this.$.composedTextFlow;
                var matters = composedTextFlow.alignmentMatters();

                if (!matters) {
                    var paragraphStyle = this.getParagraphStyleForWholeTextFlow();
                    if (paragraphStyle && paragraphStyle.$.textAnchor !== 'start') {
                        this.setStyleOnWholeFlow(null, {textAnchor: 'start'});

                        this._composeText(true, null, callback);
                    } else {
                        callback && callback();
                    }
                } else {
                    callback && callback();
                }
            },

            getStyles: function(textFlow) {
                textFlow = textFlow || this.$.textFlow;

                var styles = [];

                if (textFlow) {
                    for (var i = 0; i < textFlow.$.children.length; i++) {
                        var paragraph = textFlow.getChildAt(i);

                        for (var j = 0; j < paragraph.$.children.length; j++) {
                            var softLine = paragraph.getChildAt(j);
                            var style = softLine.$.style.serialize();
                            styles.push(style);
                        }
                    }
                }

                return styles
            },

            getFontSizes: function(textFlow) {
                textFlow = textFlow || this.$.textFlow;
                var styles = this.getStyles(textFlow);

                return _.map(styles, function(style) {
                    return style.fontSize || style.$ && style.$.fontSize;
                });
            },

            getFonts: function(textFlow) {
                textFlow = textFlow || this.$.textFlow;
                var styles = this.getStyles(textFlow);

                return _.map(styles, function(style) {
                    return style.fontId || style.$ && style.$.fontId;
                });
            },

            compose: function() {
                var ret = this.callBase();

                ret.type = "text";

                ret.restrictions = {
                    changeable: true
                };

                var transform = [],
                    flip = this.$.flip,
                    rotation = this.$.rotation,

                    width = this.width(),
                    height = this.height();

                if (rotation) {
                    transform.push("rotate(" + rotation + "," + Math.round(width / 2, 3) + "," + Math.round(height / 2, 3) + ")");
                }

                if (flip) {
                    ret.offset = ret.offset.clone();
                    if (flip.x < 0 || flip.y < 0) {
                        transform.push("scale(" + (flip.x < 0 ? -1 : 1) + "," + (flip.y < 0 ? -1 : 1) + ")");
                    }

                    if (flip.x < 0) {
                        ret.offset.set("x", ret.offset.$.x + width)
                    }

                    if (flip.y < 0) {
                        ret.offset.set("y", ret.offset.$.y + height);
                    }
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
                                        content: [lineElement.$.text.replace(/\xa0/g, "")],
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

                var properties = ret.properties || {};
                properties.autoGrow = this.$.autoGrow;
                properties.alignmentMatters = this.$.alignmentMatters;
                ret.properties = properties;

                return ret;
            },

            setColor: function(layerIndex, printColor) {
                if (this.$.ApplyStyleToElementOperation && this.$.Style) {
                    var selection = this.$.selection;
                    if (selection.$.anchorIndex === selection.$.activeIndex) {
                        selection = selection.clone();
                        selection.set({
                            anchorIndex: 0,
                            activeIndex: this.$.textFlow.textLength() - 1
                        })

                    }
                    var printType = this.$.printType;

                    if (!printType || !printColor) {
                        return;
                    }

                    var convertedPrintColor = printType.getClosestPrintColor(printColor.color());

                    if (!convertedPrintColor) {
                        return;
                    }

                    new this.$.ApplyStyleToElementOperation(selection, this.$.textFlow, new this.$.Style({printTypeColor: convertedPrintColor})).doOperation();

                    this.$.printColors.reset([convertedPrintColor]);
                }

            },

            getPossiblePrintTypes: function(appearance) {
                var ret = [],
                    tmp,
                    printArea = this.$.printArea,
                    textFlow = this.$.textFlow,
                    selection = this.$.selection;

                if (this.$context) {
                    appearance = appearance || this.$context.$contextModel.get('appearance');
                }

                if (printArea && appearance && textFlow && selection) {
                    var leaf = textFlow.findLeaf(selection.$.absoluteStart),
                        lastLeaf = textFlow.findLeaf(selection.$.absoluteEnd);

                    if (leaf) {
                        do {
                            if (leaf.$.style && leaf.$.style.$.font) {
                                tmp = ProductUtil.getPossiblePrintTypesForTextOnPrintArea(leaf.$.style.$.font.getFontFamily(), printArea, appearance);
                                _.each(tmp, function(element) {
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

            getPossiblePrintTypesForPrintArea: function(printArea, appearance) {

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
                    printTypes.push(ProductUtil.getPossiblePrintTypesForTextOnPrintArea(fontFamilies[i], printArea, appearance));
                }

                return ArrayUtil.average.apply(ArrayUtil, printTypes);

            },

            parse: function(data) {

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

                    if (this.$$.svg.text.transform) {
                        var transform = this.$$.svg.text.transform;
                        var regExp = /^scale\(([^(]+)\)/ig,
                            match = regExp.exec(transform);

                        if (match) {
                            var value = match[1],
                                values = value.split(',');

                            if (values.length === 2) {
                                var x = values[0].trim() || 1,
                                    y = values[1].trim() || 1;

                                data.flip = {
                                    x: Number(x),
                                    y: Number(y)
                                }
                            }
                        }
                    }
                }

                return data;

            },

            getSizeForPrintType: function() {
                return this.size();
            },

            size: function() {
                return this.$.textArea || Size.empty;
            }.onChange("textArea").on("sizeChanged"),

            clone: function(options) {
                options = options || {};
                options.exclude = options.exclude || [];

                options.exclude.push("bus", "composer", "textArea", "composedTextFlow", "measurer");

                var ret = this.callBase(options);
                ret.$stage = this.$stage;
                ret.$.textArea = this.$.textArea && this.$.textArea.clone();
                ret.$.composedTextFlow = null;
                return ret;
            },

            sync: function() {
                this.$stage = this._$source.$stage;
                return this.callBase();
            },

            isAllowedOnPrintArea: function(printArea) {
                return printArea && printArea.get("restrictions.textAllowed");
            },

            isReadyForCompose: function() {
                return !!this.$.composedTextFlow;
            },

            isDeepEqual: function(b) {
                if (!b) {
                    return false;
                }

                if (!(b instanceof TextConfiguration)) {
                    return false;
                }

                var comparableProperties = ['offset', 'rotation', 'printType', 'scale', 'printArea'],
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
                        } else if (newProperty === undefined && originalProperty !== undefined) {
                            return false;
                        } else if (newProperty !== undefined && originalProperty === undefined) {
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

            getCopyrightWordList: function() {
                copyrightWordList = copyrightWordList || new List();
                return copyrightWordList;
            }

        });


        return TextConfiguration;
    });

