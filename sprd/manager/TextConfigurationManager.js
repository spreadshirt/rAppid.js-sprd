define(["sprd/manager/ITextConfigurationManager", "flow", 'sprd/entity/Size', "text/entity/TextFlow", "text/entity/ParagraphElement", "text/entity/SpanElement", "sprd/type/Style", "text/entity/TextRange", "underscore"], function (Base, flow, Size, TextFlow, ParagraphElement, SpanElement, Style, TextRange, _) {
    var NON_BREAKABLE_WHITESPACE = 160;
    return Base.inherit("sprd.manager.TextConfigurationManager", {
        addParagraph: function (previousParagraph, tspan, text, textFlow) {
            if (!tspan || !text || !textFlow) {
                return;
            }

            if (previousParagraph) {
                previousParagraph.mergeElements();
            }

            // new paragraph
            var paragraph = new ParagraphElement({
                style: new Style({
                    textAnchor: tspan.textAnchor || text.textAnchor
                })
            });

            textFlow.addChild(paragraph);
            return paragraph;
        },

        generateWhiteSpaceTspans: function (tspansAmount, startY, yDelta) {
            var tspans = [], tempTSpan;
            for (var i = 0; i < tspansAmount; i++) {
                tempTSpan = {
                    content: [String.fromCharCode(NON_BREAKABLE_WHITESPACE)],
                    y: startY + i * yDelta,
                    textAnchor: "middle"
                };
                tspans.push(tempTSpan);
            }

            return tspans;
        },

        addEmptyTspans: function (tspans) {
            if (!tspans || tspans.length < 2) {
                return tspans;
            }

            var tspan, successorTspan, retArray = [];

            retArray.push(tspans[0]);
            for (var i = 0; i < tspans.length - 1; i++) {
                tspan = tspans[i];
                successorTspan = tspans[i + 1];

                var y = tspan.y,
                    lineHeight = 1.2 * tspan.fontSize,
                    yDiff = successorTspan.y - y;

                var whiteSpaceParagraphsAmount = Math.round(yDiff / lineHeight) - 1,
                    startY = y + lineHeight,
                    whiteSpaceTspans = this.generateWhiteSpaceTspans(whiteSpaceParagraphsAmount, startY, lineHeight);


                retArray = retArray.concat(whiteSpaceTspans);
                retArray.push(successorTspan);
            }

            return retArray;
        },

        initializeConfiguration: function (configuration, options, callback) {
            options = options || {};

            var self = this,
                content = configuration.$$ || {},
                svg = content.svg,
                printType = configuration.$.printType,
                product = configuration.$context.$contextModel,
                printArea,
                fontFamilies = product.$context.$contextModel.getCollection("fontFamilies"),
                properties = configuration.$.properties;

            if (properties && properties.autoGrow || options.isExample) {
                configuration.set('autoGrow', properties.autoGrow || options.isExample)
            }

            if (configuration.$initializedByManager) {
                callback && callback(null);
                return;
            }

            flow()
                .par(function (cb) {
                    printType.fetch(null, cb);
                }, function (cb) {
                    fontFamilies.fetch({
                        fullData: true
                    }, cb);
                })
                .seq(function () {
                    if (content && content.printArea) {
                        printArea = product.$.productType.getPrintAreaById(content.printArea.$.id);
                    } else {
                        printArea = configuration.$.printArea;
                    }
                })
                .seq(function () {
                    configuration.set({
                        printArea: printArea
                    });
                })
                .seq(function () {

                    if (svg) {

                        var text = svg.text,
                            viewBox = svg.viewBox,
                            textFlow = new TextFlow(),
                            content = text.content,
                            configurationObject = {};


                        var regExp = /^(\w+)\(([^(]+)\)/ig,
                            match;
                        if ((match = regExp.exec(text.transform))) {
                            var type = match[1];
                            var values = match[2].split(",");
                            if (type === "rotate") {
                                configurationObject.rotation = parseFloat(values.shift());
                            }
                        }

                        var lastTSpan = null,
                            paragraph = null,
                            maxLineWidth = parseFloat(text.width),
                            printTypeColor;

                        content = self.addEmptyTspans(content);
                        for (var i = 0; i < content.length; i++) {
                            var tspan = content[i];

                            if (_.isString(tspan)) {
                                // text tag without tspans
                                tspan = {
                                    content: [tspan]
                                }
                            }

                            if (!lastTSpan || tspan.hasOwnProperty("y")) {
                                paragraph = self.addParagraph(paragraph, tspan, text, textFlow)
                            }

                            maxLineWidth = Math.max(maxLineWidth, tspan.lineWidth || 0);

                            lastTSpan = tspan;

                            if (text.hasOwnProperty("printColorId")) {
                                tspan.printColorId = tspan.printColorId || text.printColorId;
                            }

                            tspan.fill = tspan.fill || text.fill;
                            tspan.fontFamilyId = tspan.fontFamilyId || text.fontFamilyId;
                            tspan.fontId = tspan.fontId || text.fontId;
                            tspan.fontSize = tspan.fontSize || text.fontSize;

                            printTypeColor = null;

                            if (tspan.printColorId) {
                                printTypeColor = printType.getPrintColorById(tspan.printColorId);
                            }

                            printTypeColor = printTypeColor || printType.getClosestPrintColor(tspan.fill);

                            var span = new SpanElement({
                                style: new Style({
                                    lineHeight: 1.2,
                                    font: fontFamilies.createItem(tspan.fontFamilyId).getFontById(tspan.fontId),
                                    fontSize: tspan.fontSize,
                                    printTypeColor: printTypeColor
                                }),
                                text: tspan.content[0] || ""
                            });

                            paragraph.addChild(span);
                        }

                        //Method A
                        if (viewBox) {
                            var viewBoxValues = viewBox.split(" "),
                                oldOffset = configuration.$.offset;


                            var newX = oldOffset.$.x + Number(viewBoxValues[0]),
                                newY = oldOffset.$.y + Number(viewBoxValues[1]),
                                offset = {x: newX, y: newY};

                            oldOffset.set(offset);
                        }

                        configurationObject.textFlow = textFlow;
                        configurationObject.selection = TextRange.createTextRange(0, 0);
                        configurationObject.textArea = new Size({
                            width: maxLineWidth,
                            height: text.height
                        });

                        configuration.set(configurationObject);

                    } else {
                        if (!configuration.textArea) {

                            var size = printArea.get("defaultBox") || printArea.get("boundary.size");

                            configuration.set("textArea", new Size({
                                width: configuration.get(size, "width"),
                                height: configuration.get(size, "height")
                            }));
                        }
                    }

                })
                .seq(function () {
                    configuration.$initializedByManager = true;
                })
                .exec(callback);
        }
    });
});