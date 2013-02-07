define(['sprd/entity/Configuration', "flow", 'sprd/entity/Size'], function (Configuration, flow, Size) {
	return Configuration.inherit('sprd.entity.TextConfiguration', {
		defaults : {
            text: "",
            font: null,
            fontSize: 48,
            typeFace: "regular",

            textArea: null
        },

        init: function(callback) {

            var self = this,
                $$ = self.$$,
//                svg = $$.svg,
                printType = this.$.printType,
                printArea;

            flow()
                .seq(function(cb) {
                    printType.fetch(null, cb);
                })
                .seq(function() {
                    if ($$ && $$.printArea) {
                        printArea = self.$context.$contextModel.$.productType.getPrintAreaById($$.printArea.$.id)
                    } else {
                        printArea = self.$.printArea;
                    }
                })
                .seq(function() {
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

        size: function() {
            return this.$.textArea || Size.empty;
        }.onChange("textArea")
	});
});