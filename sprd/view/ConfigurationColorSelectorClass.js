define(["js/ui/View", "sprd/entity/TextConfiguration", "sprd/entity/DesignConfiguration", "sprd/model/PrintType", "js/core/Bus", "js/core/List", "js/core/I18n"], function (View, TextConfiguration, DesignConfiguration, PrintType, Bus, List, I18n) {


    var DEFAULT_DIGITAL_COLORS = {
        black: 0x000000,
        white: 0xFFFFFF,
        cream: 0xEAD080,
        yellow: 0xEAE44B,
        "neon-yellow": 0xD9FF03,
        "yellow-gold": 0xFFC028,
        "orange": 0xE35110,
        "neon-orange": 0xFF4C0D,
        "light-brown": 0xAC8249,
        "brown": 0x4B1B00,
        "burgundy-red": 0x5B0B20,
        "pink": 0xFF9090,
        "red": 0xD41C3B,
        "neon-pink": 0xFF3484,
        "magenta": 0xA92355,
        "purple": 0x521973,
        "lavender": 0xCDBFE3,
        "sky-blue": 0x9DC8D9,
        "light-blue": 0x0091D3,
        "blue": 0x192F97,
        "navy": 0x141754,
        "emerald-green": 0x007E80,
        "green": 0x007D44,
        "neon-green": 0x00FF00,
        "bright-green": 0xB7ED6F,
        "silver-metallic": 0x7C8FA3,
        "grey": 0x787878,
        "gold-metallic": 0x8B7426
    };

    return View.inherit("sprd.view.ConfigurationColorSelectorClass", {

        defaults: {
            componentClass: "configuration-color-selector",

            /***
             * the configuration, to switch the color
             * @type sprd.entity.Configuration
             */
            configuration: null,

            layers: "{layers()}",

            autoSelectLayer: false,

            selectedLayer: null
        },

        inject: {
            bus: Bus,
            i18n: I18n
        },

        events: [
            "on:colorSelected"
        ],

        ctor: function() {
            var self = this;

            this.callBase();

            this.bind("colorPicker", "change:menuVisible", function() {
                if (!this.$.colorPicker.$.menuVisible) {
                    this.set("selectedLayer", null);
                }
            }, this);

            window.onorientationchange = function () {
                self.trigger("orientationChanged");
            };
        },

        _commitConfiguration: function() {
            this.set("layers", null);
        },

        _commitLayers: function(layers) {

            this.set("selectedLayer", null);

            if (layers && this.$.autoSelectLayer) {
                var configuration = this.$.configuration,
                    layerIndex = 0;
                if (configuration && configuration.$lastLayerIndex) {
                    layerIndex = configuration.$lastLayerIndex;
                }

                this.set("selectedLayer", layers[layerIndex]);
            }

        },

        selectLayer: function(e, layer) {

            e.preventDefault();
            e.stopPropagation();

            var configuration = this.$.configuration;
            if (configuration && layer) {
                configuration.$lastLayerIndex = layer.index;
            }

            if (layer !== this.$.selectedLayer) {
                this.set("selectedLayer", layer);
            } else {
                this.set("selectedLayer", null);
            }
        },

        getItemHeight: function () {
            var mediaQuery = window.matchMedia("(max-height: 650px)");

            return mediaQuery.matches ? 10 : 15;
        }.on("orientationChanged"),

        boolean: function(v) {
            return !!v;
        },

        _handleColorSelect: function (e) {
            if (this.$.configuration) {
                this.$.configuration.setColor(this.$.selectedLayer.index, e.$);
                this.trigger("on:colorSelected");

                // TODO: trigger custom event
                this.$.bus.trigger('Application.productChanged', this.$.product);
            }
        },

        nameForColor: function (color) {
            if (color) {
                if (color.$.name) {
                    return color.$.name;
                } else if (color.$.key) {
                    return this.$.i18n.ts('color', color.$.key);
                }
            }
            return "";

        },

        layers: function () {

            var configuration = this.$.configuration;

            if (!configuration) {
                return null;
            }

            if (configuration instanceof TextConfiguration) {
                return [{
                    index: 0
                }];
            } else if (configuration instanceof DesignConfiguration) {
                if (configuration.$.printType.$.id === PrintType.Mapping.SpecialFlex) {
                    return [{
                        index: 0
                    }];
                }
                return configuration.$.printColors.toArray(function (item, index) {
                    return {
                        index: index
                    };
                });
            }
        }.onChange("configuration").on(["configuration", "change:printType"]),

        _printTypeToColors: function (printType) {

            if (printType) {
                if (printType.isPrintColorColorSpace()) {
                    return printType.$.colors;
                } else {
                    if (!this.$digitalColorsCache) {
                        this.$digitalColorsCache = new List();

                        for (var color in DEFAULT_DIGITAL_COLORS) {
                            if (DEFAULT_DIGITAL_COLORS.hasOwnProperty(color)) {
                                var printColor = printType.getClosestPrintColor(DEFAULT_DIGITAL_COLORS[color]);
                                printColor.$.key = color;
                                this.$digitalColorsCache.add(printColor);
                            }
                        }
                    }

                    return this.$digitalColorsCache;
                }
            }

            return null;
        }
    });

});