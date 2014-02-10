define(["js/ui/View", "sprd/entity/TextConfiguration", "sprd/entity/DesignConfiguration", "sprd/model/PrintType", "js/core/Bus", "js/core/List"], function (View, TextConfiguration, DesignConfiguration, PrintType, Bus, List) {


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

            layerIndex: null
        },

        inject: {
            bus: Bus
        },

        _handleLayerSelect: function (e) {
            e.stopPropagation();
            if (e.target.$.selected) {
                var layer = e.target.find('layer');
                this.set({
                    layerIndex: layer,
                    showAppearanceSelector: false
                });

            } else {
                this.set('layerIndex', null);
            }
        },

        _handleColorSelect: function (e) {
            if (this.$.configuration) {
                this.$.configuration.setColor(this.$.layerIndex, e.$);

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
                return [0];
            } else if (configuration instanceof DesignConfiguration) {
                if (configuration.$.printType.$.id === PrintType.Mapping.SpecialFlex) {
                    return [0];
                }
                return configuration.$.printColors.toArray(function (item, index) {
                    return index;
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
        },

        isLayerSelected: function () {
            return this.$.layerIndex != null;
        }.onChange("layerIndex"),


    });

});