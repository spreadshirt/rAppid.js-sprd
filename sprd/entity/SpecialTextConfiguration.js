define(['sprd/entity/DesignConfiguration', "sprd/util/ProductUtil", "js/core/Bindable", 'pimp/data/PimpImageService', "sprd/entity/Size", 'sprd/data/ImageUploadService', "flow", 'sprd/util/UnitUtil', 'pimp/data/PimpDataSourceClass', 'js/data/Collection', 'pimp/model/Commission', 'pimp/model/Font', 'sprd/entity/Price'], function (DesignConfiguration, ProductUtil, Bindable, PimpImageService, Size, ImageUploadService, flow, UnitUtil, PimpDataSourceClass, Collection, Commission, Font, Price) {


    return DesignConfiguration.inherit('sprd.model.SpecialTextConfiguration', {

        defaults: {
            text: null,
            font: null,
            _size: Size,
            aspectRatio: 1,
            previewImageUrl: null,
            _allowScale: true,
            loading: false,
            align: null,
            initialized: false,
            commission: null
        },

        schema: {
            text: String,
            font: Font,
            /**
             * The image width used for the pimp image
             * Needed to calculate scale while parsing
             */
            generatedWidth: Number
        },

        type: "specialText",

        inject: {
            pimpImageService: PimpImageService,
            pimpDataSource: PimpDataSourceClass,
            context: "context"
        },

        _postConstruct: function () {
            this.callBase();
            this.fetchCommissions();
        },

        ctor: function () {
            this.$designCache = {};
            this.callBase();
        },

        /***
         * saves assets asynchronously
         * @param callback
         */
        save: function (callback) {

            var self = this,
                cacheId = [self.$.text, self.$.align, self.get("font.id")].join("#");

            flow()
                .seq("design", function (cb) {

                    if (self.$designCache.hasOwnProperty(cacheId)) {
                        cb(null, self.$designCache[cacheId]);
                    } else {
                        // create a full font size image
                        self.$.pimpImageService.generateDesign({
                            text: self.$.text,
                            font: self.$.font
                        }, cb);
                    }

                })
                .seq(function () {

                    var design = this.vars.design;

                    self.$designCache[cacheId] = design;
                    self.set("design", design);
                })
                .exec(callback);
        },


        _commitChangedAttributes: function ($) {
            this.callBase();

            if (!this.$.initialized) {
                return;
            }

            if (this._hasSome($, ["pimpImageService", "text", "font"])) {
                this._debounceFunctionCall(this.fetchImage, "fetchImage", 200, this, [], "DELAY");
            }
        },

        fetchImage: function (callback) {
            var self = this,
                text = this.$.text,
                font = this.$.font,
                pimpImageService = this.$.pimpImageService;

            if (pimpImageService && text && font) {
                var oldSize = this.$._size;
                this.set('loading', true);
                if (this.$lastListener) {
                    this.$lastListener.cancelled = true;
                }

                var listener = {
                    cancelled: false
                };

                var cb = function (err, data) {
                    if (listener.cancelled) {
                        return;
                    }

                    if (!err) {

                        var width = (parseInt(data.width) || 1) * 4,
                            height = (parseInt(data.height) || 1) * 4;

                        var size = UnitUtil.convertSizeToMm(new Size({width: width, height: height, unit: "px"}), self.$.printType.$.dpi);

                        self.set({
                            "generatedWidth": width,
                            "previewImageUrl": (data || {}).src,
                            "_size": size
                        });
                    } else {
                        self.set('previewImageUrl', null);
                    }
                    if (oldSize.$.width > 0) {
                        self.$.offset.set('x', self.$.offset.$.x + 0.5 * self.$.scale.x * (oldSize.$.width - self.$._size.$.width));
                    }

                    self.set('loading', false);
                    callback && callback(err);
                };

                this.$lastListener = listener;

                pimpImageService.generateImage({
                    text: text,
                    size: "M",
                    font: font
                }, cb);
            }
        },

        init: function (callback) {

            this.synchronizeFunctionCall(function (callback) {

                var self = this;

                flow()
                    .seq(function (cb) {
                        DesignConfiguration.prototype.init.call(self, cb);
                    })
                    .seq(function () {
                        var printType = self.$.printType,
                            design = self.$.design;

                        if (design) {

                            var split = design.$.name.split(";");
                            self.set({
                                font: {
                                    $: {
                                        id: split[1]
                                    }
                                },
                                align: split
                            }, {
                                silent: true
                            });

                            if (design.$.size && printType && printType.$.dpi) {
                                var dpi = printType.$.dpi;
                                self.set("_size", UnitUtil.convertSizeToMm(design.$.size, dpi), {
                                    silent: true
                                });
                            }
                        }
                    })
                    .seq(function (cb) {
                        self.fetchImage(function () {
                            cb();
                        });
                    })
                    .exec(function (err) {
                        self.set("initialized", true);
                        callback(err);
                    });

            }, "init", callback, this);


        },

        price: function () {
            var price = this.get('printType.price'),
                _designCommission = this.get("design.price") || this.get("commission.price");

            if (price) {
                price = price.clone();
            } else {
                price = new Price();
            }

            if (_designCommission) {
                price.add(_designCommission);
            } else {
                this.fetchCommissions();
            }

            return price;
        }.onChange("_printTypePrice", "commission"),

        fetchCommissions: function () {

            var self = this,
                contextCurrency = this.get("context.currency.id");
            this.synchronizeFunctionCall(function (callback) {

                this.$.pimpDataSource.createCollection(Collection.of(Commission)).fetch(null, function (err, collection) {
                    var commission;
                    if (!err) {
                        commission = collection.find(function (commission) {
                            return commission.get("price.currency.id") === contextCurrency;
                        });
                    }

                    self.set("commission", commission);
                    self.trigger("priceChanged");

                    callback(err, commission);
                });

            }, "commissions", null, this);


        },

        height: function (scale) {
            return this.callBase(scale);
        }.onChange("_size"),

        width: function (scale) {
            return this.callBase(scale);
        }.onChange("_size"),

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
})
;
