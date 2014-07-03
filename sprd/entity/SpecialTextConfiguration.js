define(['sprd/entity/DesignConfiguration', "sprd/util/ProductUtil", "js/core/Bindable", 'designer/service/SpecialTextService', "json!designer/service/preset/starwars", "sprd/entity/Size", 'sprd/data/ImageUploadService', "flow"], function (DesignConfiguration, ProductUtil, Bindable, SpecialTextService, RomanFont, Size, ImageUploadService, flow) {

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

        type: "specialText",

        inject: {
            specialTextService: SpecialTextService,
            imageUploadService: ImageUploadService

        },

        ctor: function () {
            this.callBase();

            if (!this.$.formatting) {
                this.set("formatting", new Bindable(RomanFont));
            }
        },

        /***
         * saves assets asynchronously
         * @param callback
         */
        save: function (callback) {

            var self = this;

            flow()
                .seq("imageData", function (cb) {
                    // create a full font size image
                    self.$.specialTextService.generateImage(self.$.text, {
                        // request with maximal font size
                        fontsize: 200
                    }, self.$.formatting.$, cb);
                })
                .seq("uploadDesign", function(cb) {
                    var imageUrl = this.vars.imageData.src;
                    self.$.imageUploadService.upload(imageUrl, cb);
                })
                .seq(function(cb) {
                    // set the uploaded design
                    var design = this.vars.uploadDesign.$.design;
                    self.set("design", design);

                    design.fetch(cb);
                })
                .exec(callback);
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

                            var originalOffsetX = self.$.offset.$.x + self.$._size.$.width * 0.5;

                            self.set({
                                "_size": new Size({width: DEFAULT_WIDTH, height: DEFAULT_WIDTH * (height / width)}),
                                "previewImageUrl": (data || {}).src
                            });

                            self.$.offset.set("x", originalOffsetX - DEFAULT_WIDTH * 0.5);
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