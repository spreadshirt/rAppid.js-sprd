define(["js/core/Component", 'sprd/entity/Size', 'js/core/Base', 'flow', 'sprd/extensions/AnimFrame', 'sprd/extensions/CanvasToBlob', "sprd/view/DesignImage", "sprd/model/AfterEffect", "sprd/data/ImageService"], function (Component, Size, Base, flow, AnimFrame, CanvasToBlob, DesignImage, AfterEffect, ImageService) {

    return Component.inherit('sprd.data.MaskService', {

        default: {
            context: null
        },

        inject: {
            imageService: ImageService
        },

        computeProcessedImageDebounced: function (design, afterEffect, options, callback) {
            var self = this;

            var computeHandler = function () {
                self.applyAfterEffect(design, afterEffect, options, callback);
            };

            window.requestAnimFrame(computeHandler);
        },

        getProcessedSize: function (afterEffect, design) {
            if (design) {
                return new Size({
                    width: afterEffect.width() / afterEffect.canvasScalingFactor(design),
                    height: afterEffect.height() / afterEffect.canvasScalingFactor(design),
                    unit: 'px'
                });
            }

            return null;
        },

        trimAndExport: function (ctx, afterEffect, options, callback) {
            options = options || {};
            var tempCanvas = document.createElement('canvas');
            tempCanvas.width = afterEffect.width();
            tempCanvas.height = afterEffect.height();

            var tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(ctx.canvas, afterEffect.$.offset.$.x, afterEffect.$.offset.$.y, tempCanvas.width, tempCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
            return tempCtx.canvas.toDataURL();
        },

        getImageSrcForCanvas: function (design) {
            var imageService = this.$.imageService,
                factor = AfterEffect.canvasScalingFactor(design),
                width = design.get('size.width') * factor,
                height = design.get('size.height') * factor;

            if (design && imageService && (height || width)) {
                return imageService.designImage(design.$.wtfMbsId || design.$.id, {
                    width: !width ? height : width,
                    height: !height ? width : height,
                    version: design.$.version,
                    sameOrigin: true
                });
            }

            return url;
        },

        initDesignImage: function (design, options, callback) {
            if (!design) {
                return callback();
            }

            if (!design.$.htmlImage) {
                var originalImage = new Image();

                if (options.crossOrigin) {
                    originalImage.crossOrigin = "Anonymous";
                }

                originalImage.src = this.getImageSrcForCanvas(design);
                originalImage.onerror = callback;
                originalImage.onload = function () {
                    design.set('htmlImage', originalImage);
                    callback(null, originalImage);
                };
            } else {
                callback(null, design.$.htmlImage);
            }
        },

        prepareForAfterEffect: function (design, afterEffect, options, callback) {
            options = options || {};
            var self = this;

            if (!design || !afterEffect) {
                return callback && callback(new Error('No design or afterEffect supplied.'));
            }

            flow()
                .seq('designImage', function (cb) {
                    self.initDesignImage(design, options, cb);
                })
                .seq('ctx', function () {
                    if (!options.ctx) {
                        var canvas = document.createElement('canvas');
                        return canvas.getContext('2d');
                    } else {
                        return options.ctx;
                    }
                })
                .seq(function () {
                    var img = this.vars.designImage;
                    var ctx = this.vars.ctx;
                    afterEffect.set('factor', afterEffect.canvasScalingFactor(design));
                    ctx.canvas.width = img.naturalWidth;
                    ctx.canvas.height = img.naturalHeight;
                })
                .seq(function (cb) {
                    afterEffect.initImage(null, cb);
                })
                .seq(function () {
                    var ctx = this.vars.ctx;
                    afterEffect.set('destinationWidth', ctx.canvas.width);
                    afterEffect.set('destinationHeight', ctx.canvas.height);
                })
                .exec(function (err, results) {
                    callback(err, results.ctx);
                });
        },

        applyAfterEffect: function (design, afterEffect, options, callback) {
            var self = this;
            options = options || {};


            if (!afterEffect) {
                return callback && callback(new Error("No mask supplied."));
            }

            if (!design) {
                return callback && callback(new Error("No design."));
            }

            flow()
                .seq('ctx', function (cb) {
                    self.prepareForAfterEffect(design, afterEffect, options, cb)
                })
                .seq(function (cb) {
                    var designImage = design.$.htmlImage;
                    afterEffect.apply(this.vars.ctx, designImage, options, cb);
                })
                .exec(function (err, results) {
                    callback && callback(err, results.ctx);
                });
        },

        applyMask: function (mask, design, shopId, callback) {
            var self = this,
                context = self.$.context,
                designImg = design.$.htmlImage,
                maskedDesign;

            if (!designImg) {
                return callback && callback();
            }

            flow()
                .seq("maskApplier", function () {
                    return mask.getApplier()
                })
                .seq("applierResult", function (cb) {
                    var applier = this.vars.maskApplier,
                        scalingFactor = mask.canvasScalingFactor(design);

                    applier.set({
                        maskWidth: applier.get('maskWidth') / scalingFactor,
                        maskHeight: applier.get('maskHeight') / scalingFactor,
                        designId: design.$.wtfMbsId,
                        targetShopId: shopId
                    });
                    applier.save(null, cb)
                })
                .seq('design', function (cb) {
                    if (!this.vars.applierResult || !this.vars.applierResult.$.designId) {
                        return cb();
                    }

                    maskedDesign = context.getCollection("designs").createItem("u" + this.vars.applierResult.$.designId);
                    maskedDesign.fetch(null, cb);
                })
                .exec(function (err, result) {
                    callback && callback(err, maskedDesign);
                })

        }
    });
});
