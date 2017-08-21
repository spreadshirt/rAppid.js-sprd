define(["js/ui/View", "flow", "sprd/model/PrintType", "js/core/I18n", "sprd/util/ProductUtil"], function (View, flow, PrintType, I18n, ProductUtil) {

    var LABEL_MAPPING = {};
    LABEL_MAPPING[PrintType.Mapping.Flock] = "flockPrint";
    LABEL_MAPPING[PrintType.Mapping.Flex] = LABEL_MAPPING[PrintType.Mapping.NylonFlex] = "flexPrint";
    LABEL_MAPPING[PrintType.Mapping.DigitalTransfer] = LABEL_MAPPING[PrintType.Mapping.DigitalDirect] = "digital";


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


        supportsNoPrintType: function () {
            return ProductUtil.supportsNoPrintType(this.get('product'), this.get('configuration'));
        },

        supportsPrintType: function (printType) {
            var product = this.$.product,
                configuration = this.$.configuration;

            if (!product || !configuration) {
                return;
            }

            return ProductUtil.supportsPrintType(product, configuration, printType.$.id) || this.supportsNoPrintType();
        }.onChange("configuration.scale", "product.appearance"),

        getExamplePrintColor: function (printType) {
            var configuration = this.$.configuration,
                printColors = configuration.$.printColors;

            if (!printType || !configuration || !printColors || !printColors.length) {
                return;
            }
            
            return printType.getClosestPrintColor(printColors.$items[0].$.fill);
        }.onChange('configuration').on(["configuration.printColors", "*"]),

        printTypeAvailable: function (printType) {
            var configuration = this.$.configuration,
                possiblePrintTypes = this.$.possiblePrintTypes;

            if (!configuration) {
                return false;
            }

            return possiblePrintTypes.indexOf(printType) !== -1;
        }.onChange('configuration').on(['configuration', 'change:printType']),

        labelForPrintType: function (printType) {
            if (this.$.i18n) {
                var key = LABEL_MAPPING[printType.$.id];

                if (key) {
                    return this.$.i18n.t('color.' + key);
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
                plotPrintType = null,
                digitalPrintTypes = [];

            if (possiblePrintTypes) {
                for (var i = possiblePrintTypes.length - 1; i >= 0; i--) {
                    var printType = possiblePrintTypes[i];
                    if (!printType.isPrintColorColorSpace()) {
                        digitalPrintTypes.push(printType);
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

            // if we have more than one digital print type
            if (digitalPrintTypes.length > 1) {
                // remove one
                for (var j = 0; j < digitalPrintTypes.length; j++) {
                    printType = digitalPrintTypes[j];
                    if (printType !== this.$.configuration.$.printType) {
                        possiblePrintTypes.splice(possiblePrintTypes.indexOf(printType), 1);
                        break;
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