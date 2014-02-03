define(["js/ui/View", "flow", "sprd/model/PrintType", "js/core/I18n"], function (View, flow, PrintType, I18n) {

    var LABEL_MAPPING = {};
    LABEL_MAPPING[PrintType.Mapping.Flock] = "velvety";
    LABEL_MAPPING[PrintType.Mapping.Flex] = LABEL_MAPPING[PrintType.Mapping.NylonFlex] = "smooth";


    return View.inherit('sprd.view.PrintTypePanelBase', {

        defaults: {
            specialFlex: null,
            nylonFlex: null,

            plotType: null,

            _allowFlex: null,
            _allowFlock: null,
            _allowSpecialFlex: null,
            _allowNylonFlex: null,
            _allowDigital: null,


            configuration: null,
            possiblePrintTypes: "{configuration.getPossiblePrintTypes(product.appearance)}",

            flex: null,
            flock: null,

            product: null,
            printType: null,

            _plotPrintType: null,
            _digitalPrintType: null
        },

        inject: {
            context: "context",
            i18n: I18n
        },

        labelForPrintType: function (printType) {
            if(this.$.i18n){
                var key = LABEL_MAPPING[printType.$.id];

                if(key){
                    return this.$.i18n.t('printColorSelector.'+key);
                }
            }
            return printType.$.name;
        },

        _initializationComplete: function () {
            this.callBase();

            var flex = this.$.context.createEntity(PrintType, PrintType.Mapping.Flex),
                flock = this.$.context.createEntity(PrintType, PrintType.Mapping.Flock),
                specialFlex = this.$.context.createEntity(PrintType, PrintType.Mapping.SpecialFlex),
                nylonFlex = this.$.context.createEntity(PrintType, PrintType.Mapping.NylonFlex);

            this.set({
                flex: flex,
                flock: flock,
                specialFlex: specialFlex,
                nylonFlex: nylonFlex,
                printTypes: []
            });

            setTimeout(function () {
                flow()
                    .seqEach([flock, specialFlex, nylonFlex], function (value, cb) {
                        value.fetch(null, function () {
                            cb();
                        });
                    })
                    .exec();
            }, 1000);

        },

        _commitPossiblePrintTypes: function (possiblePrintTypes) {
            var allowFlex = false,
                allowFlock = false,
                allowSpecialFlex = false,
                allowNylonFlex = false,
                allowDigital = false,
                digitalPrintType = null,
                plotPrintType = null;

            if (possiblePrintTypes) {
                var hasDigital = false;
                for (var i = possiblePrintTypes.length - 1; i >= 0; i--) {
                    var printType = possiblePrintTypes[i];
                    if (!printType.isPrintColorColorSpace()) {
                        if (!hasDigital) {
                            hasDigital = true;
                        } else {
                            possiblePrintTypes.splice(i, 1);
                            continue;
                        }
                    }
                    switch (printType.$.id) {
                        case PrintType.Mapping.Flex:
                            allowFlex = true;
                            plotPrintType = plotPrintType || printType;
                            break;
                        case PrintType.Mapping.Flock:
                            allowFlock = true;
                            plotPrintType = plotPrintType || printType;
                            break;
                        case PrintType.Mapping.SpecialFlex:
                            plotPrintType = plotPrintType || printType;
                            allowSpecialFlex = true;
                            break;
                        case PrintType.Mapping.NylonFlex:
                            plotPrintType = plotPrintType || printType;
                            allowNylonFlex = true;
                            break;
                        default:
                            digitalPrintType = digitalPrintType || printType;
                            allowDigital = true;
                    }
                }
            }

            this.set({
                _allowFlex: allowFlex,
                _allowFlock: allowFlock,
                _allowSpecialFlex: allowSpecialFlex,
                _allowNylonFlex: allowNylonFlex,
                _allowDigital: allowDigital,
                _digitalPrintType: digitalPrintType,
                _plotPrintType: plotPrintType
            });
        },

        showFlex: function () {
            return this.$._allowFlex && this.$.plotType === "smooth";
        }.onChange("_allowFlex", "plotType"),

        showNylonFlex: function () {
            return this.$._allowNylonFlex && this.$.plotType === "smooth";
        }.onChange("_allowNylonFlex", "plotType"),

        allowSmooth: function () {
            return this.$._allowFlex || this.$._allowNylonFlex;
        }.onChange("_allowNylonFlex", "_allowFlex"),

        showFlock: function () {
            return this.$._allowFlock && this.$.plotType === "velvety";
        }.onChange("_allowFlock", "plotType")

    });


});