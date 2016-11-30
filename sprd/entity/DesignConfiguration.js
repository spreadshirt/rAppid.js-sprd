define(['sprd/entity/Configuration', 'sprd/entity/Size', 'sprd/util/UnitUtil', 'sprd/model/Design', "sprd/entity/PrintTypeColor", "underscore",
        "sprd/model/PrintType", "sprd/util/ProductUtil", "js/core/List", "flow", "sprd/manager/IDesignConfigurationManager", "sprd/data/IImageUploadService", "sprd/entity/BlobImage",
        "sketchomat/helper/GreyScaler", "sketchomat/model/AfterEffect"],
    function(Configuration, Size, UnitUtil, Design, PrintTypeColor, _, PrintType, ProductUtil, List, flow, IDesignConfigurationManager, IImageUploadService, BlobImage, GreyScaler, AfterEffect) {

        return Configuration.inherit('sprd.model.DesignConfiguration', {

            schema: {
                design: Design,
                designs: {
                    type: Object,
                    required: false
                }
            },

            defaults: {
                type: 'design',
                _dpi: "{printType.dpi}",

                design: null,

                _designCommission: "{design.price}",
                _allowScale: "{design.restrictions.allowScale}",

                afterEffect: null,
                processedImage: null,
                originalDesign: null
            },

            ctor: function() {
                this.$sizeCache = {};
                this.$$ = {};
                this.callBase();

                this.bind('change:afterEffect', this.computeProcessedImage, this);
                this.bind('afterEffect.offset', 'change', this.computeProcessedImage, this);
                this.bind('afterEffect.scale', 'change', this.computeProcessedImage, this);
            },

            inject: {
                manager: IDesignConfigurationManager,
                imageUploadService: IImageUploadService
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

            computeProcessedImage: function() {
                var self = this;
                if (this.$.afterEffect) {
                    this.applyAfterEffect(this.$.afterEffect, null, function(err, result) {
                        if (!err) {
                            self.set('processedImage', result.normal)
                        } else {
                            console.error(err)
                        }
                    })
                }
            },


            prepareForAfterEffect: function(design, afterEffect, callback) {
                flow()
                    .seq('designImage', function(cb) {
                        if (!design.$.localHtmlImage) {
                            var originalImage = new Image();
                            originalImage.src = design.$.localImage;
                            originalImage.onerror = cb;
                            originalImage.onload = function() {
                                design.set('localHtmlImage', originalImage);
                                cb(null, originalImage);
                            };
                        } else {
                            cb(null, design.$.localHtmlImage);
                        }
                    })
                    .seq('ctx', function(cb) {
                        var ctx;
                        if (!design.$.canvasCtx) {
                            var img = this.vars.designImage;
                            var canvas = document.createElement('canvas');
                            var factor = AfterEffect.canvasScalingFactor(img);
                            canvas.width = img.width * factor;
                            canvas.height = img.height * factor;

                            ctx = canvas.getContext('2d');
                            design.set('canvasCtx', ctx);
                        } else {
                            ctx = design.$.canvasCtx;
                        }

                        cb(null, ctx);
                    })
                    .seq(function() {
                        afterEffect.set('destinationWidth', this.vars.ctx.canvas.width);
                        afterEffect.set('destinationHeight', this.vars.ctx.canvas.height);
                    })
                    .exec(callback);
            },

            _applyAfterEffect: function(design, afterEffect, options, callback) {
                var self = this;
                var ctx = design.$.canvasCtx;
                var designImage = design.$.localHtmlImage;
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                flow()
                    .seq(function(cb) {
                        afterEffect.apply(designImage, ctx, options, cb);
                    })
                    .seq('src', function(cb) {
                        if (options.exportAsBlob) {
                            ctx.canvas.toBlob(function(blob) {
                                cb(null, blob);
                            }, "image/png")
                        } else {
                            cb(null, ctx.canvas.toDataURL());
                        }
                    })
                    .seq('greyScale', function(cb) {
                        var cachedPreview = design.get('greyScalePreview');
                        var self = this;

                        if (cachedPreview) {
                            cb(null, cachedPreview)
                        } else {
                            GreyScaler.greyScaleImage(designImage, function(err, result) {
                                if (!err) {
                                    design.set('greyScalePreview', result);
                                }
                                cb(err, result)
                            });
                        }
                    })
                    .seq(function() {
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.drawImage(this.vars.greyScale, 0, 0, ctx.canvas.width, ctx.canvas.height);
                    })
                    .seq('gSrc', function(cb) {
                        if (options.exportAsBlob) {
                            ctx.canvas.toBlob(function(blob) {
                                cb(null, blob);
                            }, "image/png")
                        } else {
                            cb(null, ctx.canvas.toDataURL());
                        }
                    })
                    .exec(function(err, results) {
                        callback(err, {normal: results.src, greyScale: results.gSrc});
                    });
            },

            applyAfterEffect: function(afterEffect, options, callback) {
                var self = this;
                options = options || {};

                if (!callback) {
                    return;
                }

                if (!afterEffect) {
                    callback(new Error("No mask supplied."));
                    return;
                }

                var design = this.$.originalDesign || this.$.design;

                if (!design) {
                    callback(new Error("No design."));
                    return;
                }

                if (!design.$.localImage) {
                    callback(new Error("Design has no local image."));
                    return;
                }


                flow()
                    .seq(function(cb) {
                        self.prepareForAfterEffect(design, afterEffect, cb)
                    })
                    .seq('images', function(cb) {
                        var cacheId = [afterEffect.id(), design.$.wtfMbsId || design.$.id].join('#');
                        self.synchronizeFunctionCall(function(syncCB) {
                            self._applyAfterEffect(design, afterEffect, options, syncCB);
                        }, cacheId, cb, self);
                    })
                    .exec(function(err, results) {
                        callback(err, results.images);
                    });
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
            }
            ,

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
            }
            ,

            size: function() {
                return this.getSizeForPrintType(this.$.printType);
            }
                .onChange("_dpi", "design"),

            getSizeForPrintType: function(printType) {
                if (this.$.design && this.$.design.$.size && printType && printType.$.dpi) {
                    var dpi = printType.$.dpi;
                    if (!this.$sizeCache[dpi]) {
                        this.$sizeCache[dpi] = UnitUtil.convertSizeToMm(this.$.design.$.size, dpi);
                    }

                    return this.$sizeCache[dpi];
                }

                return Size.empty;
            }

            ,

            // TODO: add onchange for design.restriction.allowScale
            isScalable: function() {
                return this.get("printType.isScalable()") && this.$._allowScale;
            }
                .onChange("printType", "_allowScale"),

            allowScale: function() {
                return this.$._allowScale;
            }

            ,

            _validatePrintTypeSize: function(printType, width, height, scale) {
                var ret = this.callBase();

                var design = this.$.design;

                if (!printType || !scale || !design) {
                    return ret;
                }

                ret.minBound = !printType.isShrinkable() && Math.min(Math.abs(scale.x), Math.abs(scale.y)) * 100 < (this.get("design.restrictions.minimumScale"));
                ret.dpiBound = printType.isShrinkable() && !design.isVectorDesign() && Math.max(Math.abs(scale.x), Math.abs(scale.y)) > 1;

                return ret;

            }
            ,

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

            }
                .on("priceChanged").onChange("_designCommission", "_printTypePrice"),

            getPossiblePrintTypes: function(appearance) {
                var ret = [],
                    printArea = this.$.printArea,
                    design = this.$.design;

                if (printArea && appearance && design) {
                    ret = ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(design, printArea, appearance.$.id);
                }

                return ret;
            }

                .onChange("printArea", "design"),

            compose: function() {
                var ret = this.callBase();

                var transform = [],
                    scale = this.$.scale,
                    rotation = this.$.rotation,

                    width = this.width(),
                    height = this.height();

                if (rotation) {
                    transform.push("rotate(" + rotation + "," + Math.round(width / 2, 3) + "," + Math.round(height / 2, 3) + ")");
                }

                if (scale && (scale.x < 0 || scale.y < 0)) {
                    transform.push("scale(" + (scale.x < 0 ? -1 : 1) + "," + (scale.y < 0 ? -1 : 1) + ")");
                }

                var designId = this.get('design.wtfMbsId') || "";
                ret.content = {
                    unit: "mm",
                    dpi: "25.4",
                    svg: {
                        image: {
                            transform: transform.join(" "),
                            width: Math.round(width, 3),
                            height: Math.round(height, 3),
                            designId: designId
                        }
                    }
                };

                ret.designs = [{
                    id: designId,
                    href: "/" + this.get("design.id")
                }];

                delete ret.design;

                var printColorIds = [],
                    printColorRGBs = [];

                this.$.printColors.each(function(printColor) {
                    printColorIds.push(printColor.$.id);
                    printColorRGBs.push(printColor.color().toRGB().toString());
                });

                if (this.$.printType.isPrintColorColorSpace()) {
                    ret.content.svg.image.printColorIds = printColorIds.join(" ");
                } else {
                    ret.content.svg.image.printColorRGBs = printColorRGBs.join(" ");
                }

                ret.printColors = undefined;

                ret.restrictions = {
                    changeable: true
                };

                var mask = this.get('mask');
                if (mask) {
                    ret.properties = ret.properties || {};
                    ret.properties.maskId = mask.$.id;
                    ret.properties.originalDesignId = this.get('originalDesign.id');
                    ret.properties.maskProperties = mask.getProperties();
                }

                return ret;
            }

            ,

            save: function(callback) {
                var self = this,
                    design = this.$.design,
                    mask = this.$.mask;

                if (!mask) {
                    callback && callback();
                } else {
                    flow()
                        .seq('processedImage', function(cb) {
                            self.applyAfterEffect(mask, {exportAsBlob: true}, cb);
                        })
                        .seq('uploadDesign', function(cb) {
                            var img = new BlobImage({
                                blob: this.vars.processedImage
                            });

                            self.$.imageUploadService.upload(img, cb);
                        })
                        .seq(function() {
                            if (!self.$.originalDesign) {
                                self.set('originalDesign', design);
                            }

                            self.set('design', this.vars.uploadDesign.$.design);
                        })
                        .exec(callback)
                }
            }
            ,

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
            }
            ,

            init: function(callback) {
                this.$.manager.initializeConfiguration(this, callback);
            }
            ,

            isAllowedOnPrintArea: function(printArea) {
                return printArea && printArea.get("restrictions.designAllowed") == true;
            }
            ,

            getPossiblePrintTypesForPrintArea: function(printArea, appearanceId) {
                return ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(this.$.design, printArea, appearanceId);
            }
            ,

            minimumScale: function() {
                return (this.get("design.restrictions.minimumScale") || 100 ) / 100;
            }
        });
    })
;