define(['sprd/entity/DesignConfiguration', "sprd/util/ProductUtil", "js/core/Bindable", 'designer/service/SpecialTextService', "json!designer/service/preset/shrek", "sprd/entity/Size"], function (DesignConfiguration, ProductUtil, Bindable, SpecialTextService, RomanFont, Size) {

    var DEFAULT_WIDTH = 200;

    return DesignConfiguration.inherit('sprd.model.SpecialTextConfiguration', {

        defaults: {
            text: null,
            formatting: null,
            _size: Size,
            aspectRatio: 1,
            previewImageUrl: null,
            _allowScale: true
        },

        type: "design",

        inject: {
            specialTextService: SpecialTextService
        },

        ctor: function () {
            this.callBase();

            if (!this.$.formatting) {
                this.set("formatting", new Bindable(RomanFont));
            }
        },

        _commitImageUrl: function (imageUrl) {
            debugger;
        },

        _commitChangedAttributes: function ($) {
            this.callBase();


            if (this._hasSome($, ["specialTextService", "text", "formatting"])) {
                var self = this,
                    text = this.$.text,
                    formatting = this.$.formatting,
                    specialTextService = this.$.specialTextService;

                if (specialTextService && text && formatting) {
                    specialTextService.generateImage(text, null, formatting.$, function (err, data) {
                        if (!err) {
                            var width = parseInt(data.width) || 1,
                                height = parseInt(data.height) || 1;

                            self.set({
                                "_size": new Size({width: DEFAULT_WIDTH, height: DEFAULT_WIDTH * (height / width)}),
                                "previewImageUrl": (data || {}).src
                            });
                        } else {
                            self.set('previewImageUrl', null);
                        }
                    });
                }
            }

        },

        size: function () {
            return this.$._size;
        }.onChange("_size"),


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