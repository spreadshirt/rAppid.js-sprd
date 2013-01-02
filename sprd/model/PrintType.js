define(["sprd/data/SprdModel", "sprd/entity/Size", "sprd/entity/PrintTypeColor", "js/data/Entity"], function (SprdModel, Size, PrintTypeColor, Entity) {

    var PrintType = SprdModel.inherit("sprd.model.PrintType", {

        defaults: {
            dpi: null
        },

        schema: {
            dpi: String,
            size: Size,
            colors: [PrintTypeColor]
        },

        isScaleable: function() {
            var scaleability = this.get("restrictions.scaleability");
            return scaleability !== SCALEABILITY.UNUSABLE && scaleability === SCALEABILITY.UNSCALABLE;
        },

        isEnlargeable: function() {
            return this.get("restrictions.scaleability") === SCALEABILITY.ENLARGEABLE;
        },

        isShrinkable: function () {
            return this.get("restrictions.scaleability") === SCALEABILITY.SHRINKABLE;
        },

        containsPrintTypeColor: function(printTypeColor) {

        }
    });

    var SCALEABILITY = {
        ENLARGEABLE: "enlargeable",
        SHRINKABLE: "shrinkable",
        UNUSABLE: "unusable",
        UNSCALABLE: "unscalable"
    };

    PrintType.Restrictions = Entity.inherit("sprd.model.PrintType.Restrictions", {

        defaults: {
            colorSpace: "print_colors",
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

    // extend schema, because circular dependency between PrintType and Restriction
    PrintType.prototype.schema.restrictions = PrintType.Restrictions;

    PrintType.Restrictions.SCALEABILITY = SCALEABILITY;

    return PrintType;
});
