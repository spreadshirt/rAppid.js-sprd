define(["sprd/manager/ITextConfigurationManager", "flow", 'sprd/entity/Size'], function (Base, flow, Size) {
    return Base.inherit("sprd.manager.TextConfigurationManager", {
        initializeConfiguration: function (configuration, callback) {

            var $$ = configuration.$$,
//                svg = $$.svg,
                printType = configuration.$.printType,
                printArea;

            flow()
                .seq(function (cb) {
                    printType.fetch(null, cb);
                })
                .seq(function () {
                    if ($$ && $$.printArea) {
                        printArea = configuration.$context.$contextModel.$.productType.getPrintAreaById($$.printArea.$.id);
                    } else {
                        printArea = configuration.$.printArea;
                    }
                })
                .seq(function () {
                    if (!configuration.textArea) {

                        var size = printArea.get("defaultBox") || printArea.get("boundary.size");

                        configuration.set("textArea", new Size({
                            width: configuration.get(size, "width"),
                            height: configuration.get(size, "height")
                        }));
                    }
                })
                .exec(callback);
        }
    });
});