define(["sprd/manager/ITextConfigurationManager", "flow", 'sprd/entity/Size', "text/entity/TextFlow", "text/entity/ParagraphElement", "text/entity/SpanElement", "sprd/type/Style", "text/entity/TextRange"], function (Base, flow, Size, TextFlow, ParagraphElement, SpanElement, Style, TextRange) {
    return Base.inherit("sprd.manager.TextConfigurationManager", {
        initializeConfiguration: function (configuration, callback) {

            var content = configuration.$$ || {},
                svg = content.svg,
                printType = configuration.$.printType,
                product = configuration.$context.$contextModel,
                printArea,
                fontFamilies = product.$context.$contextModel.getCollection("fontFamilies");

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
                            viewBox = svg.viewBox.split(" "),
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
                            maxLineWidth = text.width;

                        for (var i = 0; i < content.length; i++) {
                            var tspan = content[i];

                            if (!lastTSpan || tspan.hasOwnProperty("y")) {
                                if (paragraph) {
                                    paragraph.mergeElements();
                                }

                                // new paragraph
                                paragraph = new ParagraphElement({
                                    style: new Style({
                                        textAnchor: tspan.textAnchor || text.textAnchor
                                    })
                                });

                                textFlow.addChild(paragraph);

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

                            var printTypeColor;

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

                        configurationObject.textFlow = textFlow;
                        configurationObject.selection = TextRange.createTextRange(0, 0);
                        configurationObject.textArea = new Size({
                            width: maxLineWidth + 2 * parseFloat(viewBox[0]),
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
                .exec(callback);
        }
    });
});