define(["sprd/data/SprdModel", "sprd/entity/Size", "sprd/entity/PrintTypeColor", "js/data/Entity", 'sprd/type/Color', 'sprd/entity/Price'], function (SprdModel, Size, PrintTypeColor, Entity, Color, Price) {

    var PrintType = SprdModel.inherit("sprd.model.PrintType", {

        defaults: {
            dpi: null
        },

        schema: {
            dpi: String,
            size: Size,
            colors: [PrintTypeColor],
            price: Price
        },

        printColorCache: {},

        getClosestPrintColor: function(color) {
            color = Color.parse(color);

            if (this.isPrintColorColorSpace()) {

                var minDistance = null,
                    ret = null;

                    this.$.colors.each(function (printColor) {
                        var distance = color.distanceTo(printColor.color());
                        if (minDistance === null || distance < minDistance) {
                            minDistance = distance;
                            ret = printColor;
                        }
                    });

                return ret;
            } else {
                // digital colors
                var cacheId = this.$.id + "_" + color.toRGB().toString();

                if (!this.printColorCache[cacheId]) {
                    var printTypeColor = new PrintTypeColor({
                        fill: color,
                        price: this._getDigitalPrintColorPrice()
                    });
                    printTypeColor.$parent = this;

                    this.printColorCache[cacheId] = printTypeColor;
                }

                return this.printColorCache[cacheId];
            }
        },

        isPrintColorColorSpace: function() {
            return this.get("restrictions.colorSpace") === COLOR_SPACE.PrintColors;
        },

        _getDigitalPrintColorPrice: function() {

            if (!this.$digitalPrintColorPrice) {
                this.$digitalPrintColorPrice = new Price();
            }

            return this.$digitalPrintColorPrice;
        },

        isScalable: function() {
            var scaleability = this.get("restrictions.scaleability");
            return scaleability !== SCALEABILITY.UNUSABLE && scaleability !== SCALEABILITY.UNSCALABLE;

        },

        isEnlargeable: function() {
            return this.get("restrictions.scaleability") === SCALEABILITY.ENLARGEABLE;
        },

        isShrinkable: function () {
            return this.get("restrictions.scaleability") === SCALEABILITY.SHRINKABLE;
        },

        containsPrintTypeColor: function(printTypeColor) {

            if (!printTypeColor) {
                return false;
            }

            if (this.isPrintColorColorSpace()) {
                return this.$.colors.includes(printTypeColor);
            } else {
                return true;
            }
        }
    });

    var SCALEABILITY = {
        ENLARGEABLE: "enlargeable",
        SHRINKABLE: "shrinkable",
        UNUSABLE: "unusable",
        UNSCALABLE: "unscalable"
    };

    var COLOR_SPACE = {
        PrintColors: "print_colors",
        CMYK: "cmyk",
        RGB: "rgb"
    };

    PrintType.Restrictions = Entity.inherit("sprd.model.PrintType.Restrictions", {

        defaults: {
            colorSpace: COLOR_SPACE.PrintColors,
            whiteSupported: true,
            transparencySupported: true,
            scaleability: SCALEABILITY.ENLARGEABLE,
            maxPrintColorLayers: 3
        },

        schema: {
            colorSpace: String,
            whiteSupported: Boolean,
            transparencySupported: Boolean,
            scaleability: String,
            maxPrintColorLayers: Number,

            printableAlongWithPrintTypes: [PrintType],
            printableAbovePrintTypes: [PrintType]
        }

    });

    PrintType.Mapping = {
        DigitalTransfer: "1",
        Flock: "2",
        OffsetTransfer: "3",
        ScreenPrintTransfer: "4",
        ScreenPrint: "5",
        NylonFlex: "6",
        Sticker: "7",
        ThermalSublimation: "10",
        ColdTransfer: "11",
        Flex: "14",
        SpecialFlex: "16",
        DigitalDirect: "17",
        LaserPrinter: "20",
        ButtonPrint: "21"
    };

    // extend schema, because circular dependency between PrintType and Restriction
    PrintType.prototype.schema.restrictions = PrintType.Restrictions;

    PrintType.Restrictions.SCALEABILITY = SCALEABILITY;

    PrintType.Restrictions.COLOR_SPACE = COLOR_SPACE;

    return PrintType;
});
