define(['sprd/entity/DesignConfigurationBase', 'sprd/entity/Size', 'sprd/util/UnitUtil', 'sprd/model/Design', "sprd/entity/PrintTypeColor", "underscore",
        "sprd/model/PrintType", "sprd/util/ProductUtil", "js/core/List", "flow", "sprd/manager/IDesignConfigurationManager", "sprd/data/IImageUploadService", "sprd/entity/BlobImage"],
    function(DesignConfigurationBase, Size, UnitUtil, Design, PrintTypeColor, _, PrintType, ProductUtil, List, flow, IDesignConfigurationManager, IImageUploadService, BlobImage) {

        return DesignConfigurationBase.inherit('sprd.model.DesignConfiguration', {
            defaults: {
                _dpi: "{printType.dpi}",

                _designCommission: "{design.price}",
                _allowScale: "{design.restrictions.allowScale}",

                afterEffect: null,
                processedImage: null,
                originalDesign: null
            },

            ctor: function() {
                this.$sizeCache = {};
                this.callBase();

                this.afterEffectProcessing = false;
            },

            inject: {
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

            computeProcessedImageDebounced: function(ctx, options) {
                // TODO: debounce with requestAnimationFrame
                var $w = this.$stage.$window;
                var self = this;

                if (!this.$.afterEffect) {
                    return;
                }

                $w.requestAnimFrame = $w.$requestAnimFrame || (function() {
                        return $w.requestAnimationFrame ||
                            $w.webkitRequestAnimationFrame ||
                            $w.mozRequestAnimationFrame ||
                            function(callback) {
                                $w.setTimeout(callback, 1000 / 60);
                            };
                    })();

                self.computeHandler = function() {
                    self.computeProcessedImage(ctx, options);
                };

                if (!self.afterEffectProcessing) {
                    $w.requestAnimFrame(self.computeHandler);
                    self.afterEffectProcessing = true;
                }

            },

            computeProcessedImage: function(ctx, options) {
                var self = this;
                if (this.$.afterEffect) {
                    this.applyAfterEffect(ctx, this.$.afterEffect, options, function(err, result) {
                        self.afterEffectProcessing = false;
                        if (!err) {
                            //self.set('processedImage', result)
                        } else {
                            console.error(err);
                        }
                    })
                } else {
                    //self.set('processedImage', null);
                }
            },

            prepareForAfterEffect: function(ctx, design, afterEffect, options, callback) {

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
                    .seq(function() {
                        var img = this.vars.designImage;

                        var factor = options.fullSize ? 1 : afterEffect.canvasScalingFactor(img);

                        ctx.canvas.width = img.naturalWidth * factor;
                        ctx.canvas.height = img.naturalHeight * factor;

                    })
                    .seq(function() {
                        afterEffect.set('destinationWidth', ctx.canvas.width);
                        afterEffect.set('destinationHeight', ctx.canvas.height);
                    })
                    .exec(callback);
            },

            applyAfterEffect: function(ctx, afterEffect, options, callback) {
                var self = this;
                options = options || {};


                if (!afterEffect) {
                    return callback && callback(new Error("No mask supplied."));
                }

                var design = this.$.originalDesign || this.$.design;

                if (!design) {
                    return callback && callback(new Error("No design."));
                }

                if (!design.$.localImage) {
                    return callback && callback(new Error("Design has no local image."));
                }

                flow()
                    .seq(function(cb) {
                        self.prepareForAfterEffect(ctx, design, afterEffect, options, cb)
                    })
                    .seq(function(cb) {
                        var designImage = design.$.localHtmlImage;
                        afterEffect.apply(ctx, designImage, options, callback);
                    })
                    .exec(callback);
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
            }.onChange("_dpi", "design"),

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

            compose: function() {
                var ret = this.callBase();
                var afterEffect = this.get('afterEffect');
                var originalDesign = this.get('originalDesign');

                if (afterEffect && originalDesign) {
                    ret.properties = ret.properties || {};
                    ret.properties.afterEffect = afterEffect.compose();

                    ret.properties.originalDesign = {
                        id: originalDesign.get('wtfMbsId'),
                        href: "/" + originalDesign.get("id")
                    };
                }

                return ret;
            },

            save: function(callback) {
                var self = this,
                    design = this.$.design,
                    afterEffect = this.$.afterEffect;

                if (!afterEffect) {
                    callback && callback();
                } else {
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    flow()
                        .seq('processedImage', function(cb) {
                            if (afterEffect) {
                                self.applyAfterEffect(ctx, afterEffect, {fullSize: true}, cb);
                            }
                        })
                        .seq('blob', function(cb) {
                            if (afterEffect) {
                                canvas.toBlob(function(blob) {
                                    cb(null, blob);
                                }, "image/png");
                            }
                        })
                        .seq('uploadDesign', function(cb) {
                            if (afterEffect) {
                                var img = new BlobImage({
                                    blob: this.vars.blob
                                });

                                self.$.imageUploadService.upload(img, cb);
                            }
                        })
                        .seq(function() {
                            if (afterEffect) {
                                if (!self.$.originalDesign) {
                                    self.set('originalDesign', design);
                                }

                                self.set('design', this.vars.uploadDesign.$.design);
                            }
                        })
                        .exec(function(err, results) {
                            callback(err, results);
                        })
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

            init: function(callback) {
                this.$.manager.initializeConfiguration(this, callback);
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