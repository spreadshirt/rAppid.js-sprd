define(["sprd/entity/Configuration", "sprd/entity/Size", "sprd/entity/Font", "sprd/util/ProductUtil"], function(Configuration, Size, Font, ProductUtil) {
    return Configuration.inherit('sprd.model.BendingTextConfiguration', {

        defaults: {
            fontSize: null,

            _size: Size,
            aspectRatio: 1,
            _allowScale: true,
            loading: false,
            initialized: false,
            isNew: false,
            
            angle: 50

        },

        type: "bendingText",

        $events: [
            "recalculateSize"
        ],

        init: function(callback) {
            console.log("init");
            callback && callback();
        },

        size: function() {
            return this.$._size || Size.empty;
        }.onChange("_size").on("sizeChanged"),

        _initializeBindingsBeforeComplete: function() {
            this.callBase();

            var recalculateSize = function() {
                var self = this;
                setTimeout(function() {
                    self.trigger("recalculateSize", this);
                }, 1);
            };

            this.bind("change:text", recalculateSize, this);
            this.bind("change:angle", recalculateSize, this);
            this.bind("change:font", recalculateSize, this);

        },

        textPath: function() {
            var a = this.$.angle;

            return "M 0 0 m oneTime,twoTime a oneTime,oneTime 0 1,1 0,-twoTime a oneTime,oneTime 0 1,1 0,twoTime"
                .replace(/oneTime/g, ""+ a)
                .replace(/twoTime/g, "" + (2 * a));
        }.onChange("angle"),

        getPossiblePrintTypes: function(appearance) {
            var ret = [],
                tmp,
                printArea = this.$.printArea,
                font = this.$.font;

            tmp = ProductUtil.getPossiblePrintTypesForTextOnPrintArea(font.getFontFamily(), printArea, appearance.$.id);
            _.each(tmp, function(element) {
                if (ret.indexOf(element) === -1) {
                    ret.push(element);
                }
            });

            return ret;
        }.onChange("printArea"),

        setColor: function(layerIndex, color) {
            var printColors = this.$.printColors;
            if(printColors) {
                printColors.reset([color]);
            }

        }

    });
});
