define(['sprd/entity/Size', 'js/core/Base', 'flow', 'sprd/extensions/AnimFrame'], function(Size, Base, flow, AnimFrame) {

        return {
            computeProcessedImageDebounced: function(design, afterEffect, options, callback) {
                var self = this;

                var computeHandler = function() {
                    self.applyAfterEffect(design, afterEffect, options, callback);
                };

                window.requestAnimFrame(computeHandler);
            },

            getProcessedSize: function(afterEffect, design) {
                if (design.$.localHtmlImage) {
                    return new Size({
                        width: afterEffect.width() / afterEffect.canvasScalingFactor(design.$.localHtmlImage),
                        height: afterEffect.height() / afterEffect.canvasScalingFactor(design.$.localHtmlImage),
                        unit: 'px'
                    });
                }

                return null;
            },

            trimAndExport: function(ctx, afterEffect, options, callback) {
                options = options || {};
                var tempCanvas = document.createElement('canvas');
                var factor = options.fullSize ? 1 / afterEffect.$.factor : 1;
                tempCanvas.width = afterEffect.width() * factor;
                tempCanvas.height = afterEffect.height() * factor;

                var tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(ctx.canvas, afterEffect.$.offset.$.x * factor, afterEffect.$.offset.$.y * factor, tempCanvas.width, tempCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
                if (options.blob) {
                    tempCtx.canvas.toBlob(function(blob) {
                        callback && callback(null, blob)
                    }, "image/png")
                } else {
                    callback && callback(null, tempCtx.canvas.toDataURL());
                }
            },

            prepareForAfterEffect: function(design, afterEffect, options, callback) {
                options = options || {};

                if (!design || !afterEffect) {
                    return callback && callback(new Error('No design or afterEffect supplied.'));
                }

                flow()
                    .seq('designImage', function(cb) {
                        if (!design.$.localHtmlImage) {
                            var originalImage = new Image();
                            originalImage.crossOrigin = "Anonymous";
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
                    .seq('ctx', function() {
                        if (!options.ctx) {
                            var canvas = document.createElement('canvas');
                            return canvas.getContext('2d');
                        } else {
                            return options.ctx;
                        }
                    })
                    .seq(function() {
                        var img = this.vars.designImage;
                        var ctx = this.vars.ctx;

                        var factor = options.fullSize ? 1 : afterEffect.canvasScalingFactor(img);
                        afterEffect.set('factor', afterEffect.canvasScalingFactor(img));
                        ctx.canvas.width = img.naturalWidth * factor;
                        ctx.canvas.height = img.naturalHeight * factor;
                    })
                    .seq(function(cb) {
                        afterEffect.initImage(null, cb);
                    })
                    .seq(function() {
                        var ctx = this.vars.ctx;
                        afterEffect.set('destinationWidth', ctx.canvas.width);
                        afterEffect.set('destinationHeight', ctx.canvas.height);
                    })
                    .exec(function(err, results) {
                        callback(err, results.ctx);
                    });
            },

            applyAfterEffect: function(design, afterEffect, options, callback) {
                var self = this;
                options = options || {};


                if (!afterEffect) {
                    return callback && callback(new Error("No mask supplied."));
                }

                if (!design) {
                    return callback && callback(new Error("No design."));
                }

                if (!design.$.localImage) {
                    return callback && callback(new Error("Design has no local image."));
                }

                flow()
                    .seq('ctx', function(cb) {
                        self.prepareForAfterEffect(design, afterEffect, options, cb)
                    })
                    .seq(function(cb) {
                        var designImage = design.$.localHtmlImage;
                        afterEffect.apply(this.vars.ctx, designImage, options, cb);
                    })
                    .exec(function(err, results) {
                        callback && callback(err, results.ctx);
                    });
            }
        }
    }
);
