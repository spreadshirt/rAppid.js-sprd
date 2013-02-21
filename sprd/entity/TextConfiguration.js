define(['sprd/entity/Configuration', "flow", 'sprd/entity/Size', 'underscore', 'sprd/model/PrintType'], function (Configuration, flow, Size, _, PrintType) {
    return Configuration.inherit('sprd.entity.TextConfiguration', {
        defaults: {
            textArea: null,
            textFlow: null,
            composedTextFlow: null
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

        size: function () {
            return this.$.textArea || Size.empty;
        }.onChange("textArea")
    });
});