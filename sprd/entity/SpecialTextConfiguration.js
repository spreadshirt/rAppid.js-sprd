define(['sprd/entity/DesignConfiguration', "sprd/util/ProductUtil", "js/core/Bindable", 'pimp/data/PimpImageService', "sprd/entity/Size", 'sprd/data/ImageUploadService', "flow", 'sprd/util/UnitUtil'], function (DesignConfiguration, ProductUtil, Bindable, PimpImageService, Size, ImageUploadService, flow, UnitUtil) {

    return DesignConfiguration.inherit('sprd.model.SpecialTextConfiguration', {

        defaults: {
            text: null,
            font: null,
            _size: Size,
            aspectRatio: 1,
            previewImageUrl: null,
            _allowScale: true,
            loading: false
        },

        type: "specialText",

        inject: {
            pimpImageService: PimpImageService,
            imageUploadService: ImageUploadService
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
                    self.$.pimpImageService.generateImage({
                        text: self.$.text,
                        size: "X",
                        font: self.$.font
                    }, cb);
                })
                .seq("uploadDesign", function (cb) {
                    var imageUrl = this.vars.imageData.src;
                    self.$.imageUploadService.upload(imageUrl, cb);
                })
                .seq(function (cb) {
                    // set the uploaded design
                    var design = this.vars.uploadDesign.$.design;
                    self.set("design", design);

                    design.fetch(cb);
                })
                .exec(callback);
        },


        _commitChangedAttributes: function ($) {
            this.callBase();

            if (this._hasSome($, ["pimpImageService", "text", "font"])) {
                var self = this;
                var oldSize = this.$._size;
                this.fetchImage(function (err) {
                    self.$.offset.set('x', self.$.offset.$.x + 0.5 * self.$.scale.x * (oldSize.$.width - self.$._size.$.width));
                });
            }
        },

        fetchImage: function (callback) {
            var self = this,
                text = this.$.text,
                font = this.$.font,
                pimpImageService = this.$.pimpImageService;

            if (pimpImageService && text && font) {
                this.set('loading', true);
                pimpImageService.generateImage({
                    text: text,
                    size: "M",
                    font: font
                }, function (err, data) {
                    if (!err) {

                        var width = (parseInt(data.width) || 1) * 4,
                            height = (parseInt(data.height) || 1) * 4;

                        self.set({
                            "_size": UnitUtil.convertSizeToMm(new Size({width: width, height: height, unit: "px"}), self.$.printType.$.dpi),
                            "previewImageUrl": (data || {}).src
                        });

                    } else {
                        self.set('previewImageUrl', null);
                    }

                    self.set('loading', false);
                    callback && callback(err);
                });
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

        getSizeForPrintType: function (printType) {
            if (printType && printType.$.dpi) {
                var dpi = printType.$.dpi;
                return UnitUtil.convertSizeToMm(this.$._size, dpi);
            }

            return Size.empty;
        },

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