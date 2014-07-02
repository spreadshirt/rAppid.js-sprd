define(['sprd/entity/DesignConfiguration', "sprd/util/ProductUtil", "js/core/Bindable", 'designer/service/SpecialTextService', "json!designer/service/preset/roman"], function (DesignConfiguration, ProductUtil, Bindable, SpecialTextService, RomanFont) {

    return DesignConfiguration.inherit('sprd.model.SpecialTextConfiguration', {

        defaults: {
            text: null,
            formatting: null,

            previewImageUrl: null
        },

        type: "design",

        inject: {
            specialTextService: SpecialTextService
        },

        ctor: function() {
            this.callBase();

            if (!this.$.formatting) {
                this.set("formatting", new Bindable(RomanFont));
            }
        },

        _commitImageUrl: function(imageUrl) {
            debugger;
        },

        _commitChangedAttributes: function ($) {
            this.callBase();

            if (this._hasSome($, ["formatting", "text"])) {
                var self = this,
                    text = this.$.text,
                    formatting = this.$.formatting,
                    specialTextService = this.$.specialTextService;

                if (specialTextService && text && formatting) {
                    specialTextService.generateImage(text, null, formatting, function (err, data) {
                        self.set("previewImageUrl", (data || {}).src);
                    });
                }
            }
        },

        getPossiblePrintTypes: function (appearance) {
            var ret = [],
                printArea = this.$.printArea,
                design = this.$.design;

            if (printArea && appearance && design) {
                ret = ProductUtil.getPossiblePrintTypesForSpecialText(printArea, appearance.$.id);
            }

            return ret;
        }.onChange("printArea"),

        isAllowedOnPrintArea: function (printArea) {
            return printArea && printArea.get("restrictions.designAllowed") == true &&
                printArea.get("restrictions.textAllowed") == true;
        },

        getPossiblePrintTypesForPrintArea: function (printArea, appearanceId) {
            return ProductUtil.getPossiblePrintTypesForSpecialText(printArea, appearanceId);
        },

        minimumScale: function () {
            // TODO:
            return this.callBase();
        }
    });
});