define(['sprd/entity/DesignConfigurationBase', 'sprd/entity/Size', 'sprd/util/UnitUtil', 'sprd/model/Design', "sprd/entity/PrintTypeColor", "underscore",
        "sprd/model/PrintType", "sprd/util/ProductUtil", "js/core/List", "flow", "sprd/manager/IDesignConfigurationManager", "designer/manager/TrackingManager", "sprd/data/IImageUploadService", "sprd/entity/BlobImage", "sprd/helper/AfterEffectHelper"],
    function(DesignConfigurationBase, Size, UnitUtil, Design, PrintTypeColor, _, PrintType, ProductUtil, List, flow, IDesignConfigurationManager, TrackingManager, IImageUploadService, BlobImage, AfterEffectHelper) {

        return DesignConfigurationBase.inherit('sprd.model.DesignConfiguration', {
            defaults: {
                _dpi: "{printType.dpi}",

                _designCommission: "{design.price}",
                _allowScale: "{design.restrictions.allowScale}",
                _afterEffectApplied: false,

                afterEffect: null,

                processedImage: null,
                processedSize: null,
                originalDesign: null
            },


            ctor: function() {
                this.callBase();

                this.bind('change:processedImage', this._setProcessedSize, this);
                this.bind('change:originalDesign', this._setOriginalDesignProperties, this);
            },

            inject: {
                imageUploadService: IImageUploadService,
                tracking: TrackingManager
            },

            type: "design",

            _commitPrintType: function(printType) {
                // print type changed -> convert colors

                if (!printType) {
                    return;
                }

                var colors = [],
                    printColors = this.$.printColors;

                printColors.each(function(printColor) {
                    colors.push(printType.getClosestPrintColor(printColor.color()));
                });

                if (printType.$.id === PrintType.Mapping.SpecialFlex) {
                    // convert all colors to the first one
                    for (var i = 1; i < colors.length; i++) {
                        colors[i] = colors[0];
                    }
                }

                printColors.reset(colors);
                this.trigger('configurationChanged');
                this.trigger("priceChanged");
            },

            _commitAfterEffect: function(afterEffect) {
                var self = this;
                if (!afterEffect) {
                    this.set('processedImage', null);
                } else {
                    AfterEffectHelper.computeProcessedImageDebounced(self.$.design, afterEffect, null, function(err, ctx) {
                        self.applyAfterEffect(ctx);
                    });
                }
            },

            _setProcessedSize: function() {
                var afterEffect = this.$.afterEffect;
                var design = this.$.design;

                if (afterEffect && this.$.processedImage) {
                    this.set('processedSize', AfterEffectHelper.getProcessedSize(afterEffect, design));
                } else {
                    this.set('processedSize', null);
                }

                this.trigger('sizeChanged');
            },

            applyAfterEffect: function(ctx) {
                this.setProcessedImage(ctx);
                this.set('_afterEffectApplied', true);
                this.trigger('configurationChanged');
            },

            setProcessedImage: function(ctx) {
                var self = this;

                if (!self.$.design || !self.$.afterEffect) {
                    return;
                }

                var cacheId = [self.$.design.$.id, self.$.afterEffect.id()].join('#');
                self.synchronizeFunctionCall.call(self, function(cb) {
                    flow()
                        .seq('img', function() {
                            return AfterEffectHelper.trimAndExport(ctx, self.$.afterEffect);
                        })
                        .exec(function(err, result) {
                            cb(err, result.img);
                        });

                }, cacheId, function(err, result) {
                    self.set('processedImage', result);
                }, self);
            },

            getPrintColorsAsRGB: function() {
                var ret = [];

                if (this.$.design.$.colors.size() === this.$.printColors.size()) {
                    // go in the direction of the layers of the design
                    for (var i = 0; i < this.$.design.$.colors.$items.length; i++) {
                        var designColor = this.$.design.$.colors.$items[i];
                        var printColor = this.$.printColors.$items[i];
                        ret[designColor.$.layer] = printColor.color().toRGB().toHexString();
                    }
                }

                return ret;
            },

            setColor: function(layerIndex, color) {
                var printType = this.$.printType;

                if (!(color instanceof PrintTypeColor)) {
                    color = printType.getClosestPrintColor(color);
                }

                if (!printType.containsPrintTypeColor(color)) {
                    throw new Error("Color not contained in print type");
                }

                var printColors = this.$.printColors.$items;

                if (printColors[layerIndex] === color) {
                    return;
                }

                printColors.splice(layerIndex, 1, color);

                if (printType.$.id === PrintType.Mapping.SpecialFlex) {
                    // convert all other layers to the new color
                    for (var i = 0; i < printColors.length; i++) {
                        if (i !== layerIndex) {
                            printColors[i] = printColors[layerIndex];
                        }
                    }
                }

                this.$.printColors.reset(printColors);

                this.trigger('configurationChanged');
                this.trigger("priceChanged");
            },

            size: function() {
                return this.getSizeForPrintType(this.$.printType);
            }.onChange("_dpi", "design").on("change:processedSize"),

            getSizeForPrintType: function(printType) {
                if (this.$.design && this.$.design.$.size && printType && printType.$.dpi) {
                    var dpi = printType.$.dpi;
                    return UnitUtil.convertSizeToMm(this.$.processedSize || this.$.design.$.size, dpi);
                }

                return Size.empty;
            },

            // TODO: add onchange for design.restriction.allowScale
            isScalable: function() {
                return this.get("printType.isScalable()") && this.$._allowScale;
            }.onChange("printType", "_allowScale"),

            allowScale: function() {
                return this.$._allowScale;
            },

            _validatePrintTypeSize: function(printType, width, height, scale) {
                var ret = this.callBase();

                var design = this.$.design;

                if (!printType || !scale || !design) {
                    return ret;
                }

                ret.minBound = !printType.isShrinkable() && Math.min(Math.abs(scale.x), Math.abs(scale.y)) * 100 < (this.get("design.restrictions.minimumScale"));
                ret.dpiBound = printType.isShrinkable() && !design.isVectorDesign() && Math.max(Math.abs(scale.x), Math.abs(scale.y)) > 1;

                return ret;
            },

            price: function() {

                var usedPrintColors = [],
                    price = this.callBase();

                this.$.printColors.each(function(printColor) {
                    if (_.indexOf(usedPrintColors, printColor) === -1) {
                        usedPrintColors.push(printColor);
                    }
                });

                for (var i = 0; i < usedPrintColors.length; i++) {
                    if (usedPrintColors[i]) {
                        price.add((usedPrintColors[i]).get("price"));
                    }
                }

                price.add(this.get('_designCommission'));

                return price;

            }.on("priceChanged").onChange("_designCommission", "_printTypePrice"),

            getPossiblePrintTypes: function(appearance) {
                var ret = [],
                    printArea = this.$.printArea,
                    design = this.$.design;

                if (printArea && appearance && design) {
                    ret = ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(design, printArea, appearance.$.id);
                }

                return ret;
            }.onChange("printArea", "design"),

            _setAfterEffectProperties: function() {
                var afterEffect = this.get('afterEffect');
                var properties = this.get('properties');

                if (afterEffect) {
                    properties.afterEffect = afterEffect.compose();
                    properties.type = 'afterEffect';
                }
            },

            _setOriginalDesignProperties: function() {
                var properties = this.get('properties');
                var originalDesign = this.get('originalDesign');

                if (originalDesign) {
                    //Mask is already applied and processedImage uploaded
                    properties.originalDesign = {
                        id: originalDesign.get('wtfMbsId'),
                        href: "/" + originalDesign.get("id")
                    };
                }
            },

            compose: function() {
                var ret = this.callBase();
                this._setAfterEffectProperties();
                this._setOriginalDesignProperties();
                ret.properties = this.$.properties;
                return ret;
            },

            save: function(callback) {
                var self = this,
                    design = this.$.design,
                    afterEffect = this.$.afterEffect;

                if (!afterEffect) {
                    callback && callback();
                } else {
                    this.$.tracking.trackMaskSaved(afterEffect);
                    flow()
                        .seq('ctx', function(cb) {
                            if (afterEffect) {
                                AfterEffectHelper.applyAfterEffect(design, afterEffect, {fullSize: true}, cb);
                            } else {
                                cb();
                            }
                        })
                        .seq('blob', function(cb) {
                            if (afterEffect) {
                                this.vars.ctx.canvas.toBlob(function(blob) {
                                    cb(null, blob);
                                }, "image/png");
                            } else {
                                cb();
                            }
                        })
                        .seq('uploadDesign', function(cb) {
                            if (afterEffect) {
                                var img = new BlobImage({
                                    blob: this.vars.blob
                                });

                                self.$.imageUploadService.upload(img, cb);
                            } else {
                                cb();
                            }
                        })
                        .seq(function() {
                            if (afterEffect) {
                                if (!self.$.originalDesign) {
                                    self.set('originalDesign', design);
                                }

                                self.set('design', this.vars.uploadDesign.$.design);
                                self.trigger('configurationChanged');
                            }
                        })
                        .exec(callback);
                }
            },

            parse: function(data) {
                data = this.callBase();

                if (data.designs) {
                    this.$$.design = data.designs[0];
                }

                data.designs = undefined;

                if (data.printArea) {
                    // remove printArea from payload since it is the wrong one
                    // it will be set within the initSchema methods
                    this.$$.printArea = data.printArea;
                    data.printArea = null;
                }

                if (data.content) {
                    this.$$.svg = data.content.svg;
                }

                return data;
            },

            saveTakesTime: function() {
                return this.get('afterEffect');
            },

            init: function(options, callback) {
                this.$.manager.initializeConfiguration(this, options, callback);
            },

            isAllowedOnPrintArea: function(printArea) {
                return printArea && printArea.get("restrictions.designAllowed") == true;
            },

            getPossiblePrintTypesForPrintArea: function(printArea, appearanceId) {
                return ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(this.$.design, printArea, appearanceId);
            },

            minimumScale: function() {
                return (this.get("design.restrictions.minimumScale") || 100 ) / 100;
            }
        });
    })
;