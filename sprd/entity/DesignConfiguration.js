define(['sprd/entity/DesignConfigurationBase', 'sprd/entity/Size', 'sprd/util/UnitUtil', 'sprd/model/Design', "sprd/entity/PrintTypeColor", "underscore",
        "sprd/model/PrintType", "sprd/util/ProductUtil", "js/core/List", "flow", "sprd/manager/IDesignConfigurationManager", "sprd/data/IImageUploadService"
        ,"sprd/entity/BlobImage", "sprd/data/MaskService", "sprd/data/ImageService", "sprd/manager/ImageMeasurer"],
    function (DesignConfigurationBase, Size, UnitUtil, Design, PrintTypeColor, _, PrintType, ProductUtil, List, flow
              , IDesignConfigurationManager, IImageUploadService, BlobImage, MaskService, ImageService, ImageMeasurer) {

        return DesignConfigurationBase.inherit('sprd.model.DesignConfiguration', {
            defaults: {
                _dpi: "{printType.dpi}",

                _designCommission: "{design.price}",
                _allowScale: "{design.restrictions.allowScale}",

                afterEffect: null,
                processedDesign: null,
                processedImage: null,
                processedSize: null,
                innerRect: null
            },


            ctor: function () {
                this.callBase();

                this.bind('change:processedImage', this._setProcessedSize, this);
                this.bind('change:processedDesign', function() {this._setOriginalDesignProperties()}, this);
            },

            inject: {
                imageUploadService: IImageUploadService,
                maskService: MaskService,
                imageService: ImageService,
                context: "context"
            },

            type: "design",

            _commitPrintType: function (newPrintType, oldPrintType) {
                // print type changed -> convert colors

                if (!newPrintType) {
                    return;
                }

                var colors = [],
                    printColors = this.$.printColors;

                printColors.each(function (printColor) {
                    colors.push(newPrintType.getClosestPrintColor(printColor.color()));
                });

                if (newPrintType.$.id === PrintType.Mapping.SpecialFlex) {
                    // convert all colors to the first one
                    for (var i = 1; i < colors.length; i++) {
                        colors[i] = colors[0];
                    }
                }

                var original = this.get('originalPrintType');
                if (original && original !== oldPrintType) {
                    this.set('originalPrintType', null);
                }

                printColors.reset(colors);
                this.trigger('configurationChanged');
                this.trigger("priceChanged");
            },

            _commitAfterEffect: function (afterEffect) {
                var self = this;

                if (!afterEffect) {
                    this.set('processedImage', null);
                } else {
                    this.$.maskService.applyAfterEffect(self.$.design, afterEffect, null, function (err, ctx) {
                        if (!err) {
                            self.applyAfterEffect(ctx);
                        } else {
                            console.error(err);
                        }

                        afterEffect.callback && afterEffect.callback(err, ctx);
                    });
                }
            },

            _validatePrintTypeSize: function (printType, width, height, scale) {
                var ret = this.callBase();
                var design = this.$.design;

                if (!printType || !scale || !_.isNumber(width) || !_.isNumber(height) || !design) {
                    return ret;
                }

                if (!design.isVectorDesign()) {
                    ret.dpiBound = scale.x > 1 || scale.y > 1;
                }

                ret.minBound = !printType.isShrinkable() && Math.min(Math.abs(scale.x), Math.abs(scale.y)) * 100 < (this.get("design.restrictions.minimumScale"));

                return ret;
            },

            _setProcessedSize: function () {
                var afterEffect = this.$.afterEffect;
                var design = this.$.design;

                if (afterEffect && this.$.processedImage) {
                    this.set('processedSize', this.$.maskService.getProcessedSize(afterEffect, design));
                } else {
                    this.set('processedSize', null);
                }

                this.trigger('sizeChanged');
            },

            applyAfterEffect: function (ctx) {
                this.setProcessedImage(ctx);
                this.trigger('configurationChanged');
            },

            setProcessedImage: function (ctx) {
                var self = this;

                if (!self.$.design || !self.$.afterEffect) {
                    return;
                }

                var cacheId = [self.$.design.$.id, self.$.afterEffect.id()].join('#');
                self.synchronizeFunctionCall.call(self, function (cb) {
                    var img = self.$.maskService.trimAndExport(ctx, self.$.afterEffect, null);
                    cb(null, img);
                }, cacheId, function (err, result) {
                    self.set('processedImage', result);
                }, self);
            },

            getPrintColorsAsRGB: function () {
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

            setColor: function (layerIndex, color) {
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

            size: function () {
                return this.getSizeForPrintType(this.$.printType);
            }.onChange("_dpi", "design", "processedSize"),

            getSizeInPx: function (design, options) {
                options = options || {};
                design = design || this.$.design;
                return options.original ? design.$.size : this.$.processedSize || design.$.size;
            },

            getSizeForPrintType: function (printType, design, options) {
                options = options || {};
                design = design || this.$.design;
                printType = printType || this.$.printType;

                if (design && design.$.size && printType && printType.$.dpi) {
                    var dpi = printType.$.dpi;
                    var size = this.getSizeInPx(design, options);
                    return UnitUtil.convertSizeToMm(size, dpi);
                }

                return Size.empty;
            },

            isScalable: function () {
                return this.get("printType.isScalable()") && this.$._allowScale;
            }.onChange("printType", "_allowScale"),

            allowScale: function () {
                return this.$._allowScale;
            },

            getImageUrl: function () {
                var design = this.$.design;
                if (!design) {
                    return;
                }
                
                return this.$.processedImage || design.$.localImage || this.$.imageService.designImageFromCache(design.$.wtfMbsId, {width: 100});
            },

            setInnerRect: function () {
                var url = this.getImageUrl(),
                    self = this;

                if (!url) {
                    return;
                }

                flow()
                    .seq("image", function (cb) {
                        ImageMeasurer.toImage(url, cb)
                    })
                    .seq("rect",function () {
                        return ImageMeasurer.getRealDesignSize(this.vars.image);
                    })
                    .exec(function (err, results) {
                        if (!err) {
                           self.set("innerRect", results.rect);
                        }
                    })
            },

            _getRotatedInnerBoundingBox: function (offset, width, height, rotation, scale) {
                var bbox = this._getRotatedBoundingBox(offset, width, height, rotation, scale),
                    innerRect = this.$.innerRect;

                if (innerRect) {
                    return {
                        x: bbox.x + bbox.width * innerRect.x,
                        y: bbox.y + bbox.width * innerRect.y,
                        width: bbox.width * innerRect.width,
                        height: bbox.height * innerRect.height,
                        rotation: bbox.rotation
                    }
                }

                return bbox;
            },



            price: function () {

                var usedPrintColors = [],
                    price = this.callBase();

                this.$.printColors.each(function (printColor) {
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

            getPossiblePrintTypes: function (appearance) {
                var ret = [],
                    printArea = this.$.printArea,
                    design = this.$.design;

                if (printArea && appearance && design) {
                    ret = ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(design, printArea, appearance);
                }

                return ret;
            }.onChange("printArea", "design"),

            _setAfterEffectProperties: function () {
                var afterEffect = this.get('afterEffect');
                var properties = this.get('properties');

                if (afterEffect) {
                    properties.afterEffect = _.extend(properties.afterEffect || {}, afterEffect.compose());
                    properties.type = 'afterEffect';
                }
            },

            _setOriginalDesignProperties: function (design) {
                var properties = this.get('properties'),
                    afterEffect = this.get('afterEffect');

                design = design || this.$.processedDesign;

                if (design && afterEffect) {
                    //Mask is already applied and processedImage uploaded
                    properties.afterEffect = properties.afterEffect || {};
                    properties.afterEffect.originalDesign = {
                        id: design.get('wtfMbsId'),
                        href: "/" + design.get("id")
                    };
                }
            },

            originalSize: function () {
                return this.getSizeForPrintType(this.$.printType, null, {original: true});
            },

            compose: function () {
                var processedDesign = this.get('processedDesign'),
                    originalDesign = this.get('design');

                if (processedDesign) {
                    this.set('design', processedDesign, {silent: true});
                }

                var ret = this.callBase();
                this._setAfterEffectProperties();
                this._setOriginalDesignProperties(originalDesign);
                ret.properties = this.$.properties;

                if (processedDesign && originalDesign) {
                    this.set('design', originalDesign);
                }
                
                return ret;
            },

            save: function (callback) {
                var self = this,
                    afterEffect = this.$.afterEffect;

                if (!afterEffect) {
                    callback && callback();
                } else {
                    flow()
                        .seq("design", function (cb) {
                            var afterEffect = self.$.afterEffect;
                            if (afterEffect) {
                                self.$.maskService.applyMask(afterEffect, self.$.design, self.$.context.$.id, cb);
                            }
                        })
                        .seq(function () {
                            if (this.vars.design) {
                                self.set('processedDesign', this.vars.design);
                            }
                        })
                        .exec(callback);
                }
            },

            parse: function (data) {
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

            saveTakesTime: function () {
                return this.get('afterEffect');
            },

            init: function (options, callback) {
                this.$.manager.initializeConfiguration(this, options, callback);
                this.setInnerRect();
            },

            isAllowedOnPrintArea: function (printArea) {
                return printArea && printArea.get("restrictions.designAllowed") == true;
            },

            getPossiblePrintTypesForPrintArea: function (printArea, appearance) {
                return ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(this.$.design, printArea, appearance);
            },

            minimumScale: function () {
                return (this.get("design.restrictions.minimumScale") || 100 ) / 100;
            }
        });
    })
;