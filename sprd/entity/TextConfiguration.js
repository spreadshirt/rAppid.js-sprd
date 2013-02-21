define(['sprd/entity/Configuration', "flow", 'sprd/entity/Size', 'underscore'], function (Configuration, flow, Size, _) {
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