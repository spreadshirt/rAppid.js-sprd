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
                }, function(cb) {
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
                            textFlow = new TextFlow(),
                            content = text.content;

                        var lastTSpan = null,
                            paragraph = null;

                        for (var i = 0; i < content.length; i++) {
                            var tspan = content[i];

                            if (!lastTSpan || tspan.hasOwnProperty("y")) {
                                if (paragraph) {
                                    paragraph.mergeElements();
                                }

                                // new paragraph
                                paragraph = new ParagraphElement({
                                    style: new Style({
                                        textAnchor: tspan.textAnchor
                                    })
                                });

                                textFlow.addChild(paragraph);

                            }

                            lastTSpan = tspan;

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
                                text: tspan.content[0]
                            });

                            paragraph.addChild(span);


                        }

                        configuration.set({
                            textFlow: textFlow,
                            selection: TextRange.createTextRange(0, 0),
                            textArea: new Size({
                                width: text.width,
                                height: text.height
                            })
                        });

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