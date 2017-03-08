define(["sprd/model/AfterEffect", "sprd/model/Design", "sprd/entity/Offset", "sprd/entity/Scale", "flow", "rAppid"], function(AfterEffect, Design, Offset, Scale, flow, rappid) {

    return AfterEffect.inherit("sketchomat.model.Mask", {
        defaults: {
            htmlImage: null,
            offset: Offset,
            scale: Scale,
            fixedAspectRatio: null,
            maxOffset: Offset,
            maxScale: Scale,
            destinationWidth: null,
            destinationHeight: null
        },

        ctor: function() {
            this.callBase();
            this.initDefaults();
            this.initBindings();
        },

        initDefaults: function() {
            this.$.offset.set('unit', 'px');
            this.$.maxOffset.set('unit', 'px');
            this.$.scale.set('fixedAspectRatio', this.$.fixedAspectRatio);
            this.$.maxScale.set('fixedAspectRatio', this.$.fixedAspectRatio);
        },

        initBindings: function() {
            this.bind('change:destinationWidth', this.initMask, this);
            this.bind('change:destinationHeight', this.initMask, this);
            this.bind('offset', 'change', this.offsetChanged, this);
            this.bind('scale', 'change', this.scaleChanged, this);
            this.bind('scale', 'change', this.adjustOffsetHandler, this);
        },

        scaleChanged: function() {
            this.calculateMaxOffset();
            this.trigger("processingParametersChanged");
        },

        offsetChanged: function() {
            this.calculateMaxScale();
            this.trigger("processingParametersChanged");
        },

        previewUrl: function() {
            throw new Error("Not implemented");
        },

        clamp: function(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },

        initImage: function(options, callback) {
            callback && callback(new Error("Not implemented"));
        },

        centerAt: function(x, y, options) {
            var newX, newY;

            options = options || {};

            if (!this.$.destinationWidth || !this.$.destinationHeight) {
                throw Error('Cannot center mask. No destination parameters set');
            }

            newX = x;
            newY = y;

            if (options.relative) {
                newX = x * this.$.destinationWidth;
                newY = y * this.$.destinationHeight;
            }

            newX = this.clamp(newX - this.width() / 2, 0, this.$.maxOffset.$.x);
            newY = this.clamp(newY - this.height() / 2, 0, this.$.maxOffset.$.y);

            this.$.offset.set({
                'x': Math.round(newX),
                'y': Math.round(newY)
            });
        },

        height: function(scale) {
            var img = this.$.htmlImage;
            if (img && img.naturalHeight) {
                return (scale || this.get('scale.y')) * img.naturalHeight;
            }

            return null;
        },

        width: function(scale) {
            var img = this.$.htmlImage;
            if (img && img.complete) {
                return (scale || this.get('scale.x')) * img.naturalWidth;
            }

            return null;
        },

        initMask: function(options) {
            var width = this.$.destinationWidth;
            var height = this.$.destinationHeight;

            var originalWidth = this.width(1);
            var originalHeight = this.height(1);
            if (width && height && originalWidth && originalHeight) {
                if (!this.$.initialized || options.force) {
                    var factor = Math.min(width / originalWidth, height / originalHeight);
                    this.$.scale.set('y', factor);
                    this.$.scale.set('x', factor);
                    this.calculateMaxOffset();
                    this.centerAt(width / 2, height / 2);
                    this.calculateMaxScale();
                    this.set('initialized', true);
                } else {
                    this.calculateMaxOffset();
                    this.calculateMaxScale();
                }
            }
        },

        calculateMaxOffset: function(x, y) {
            var maxOffset = this.$.maxOffset;
            var width = this.$.destinationWidth;
            var height = this.$.destinationHeight;

            if (!maxOffset || !width || !height) {
                return;
            }

            var xScale = x || this.$.scale.$.x;
            var yScale = y || this.$.scale.$.y;

            if (xScale) {
                this.$.maxOffset.set('x', Math.floor(width - this.width(xScale)));
            }
            if (yScale) {
                this.$.maxOffset.set('y', Math.floor(height - this.height(yScale)));
            }
        },

        calculateMaxScale: function() {
            var maxScale = this.$.maxScale;
            var width = this.$.destinationWidth;
            var height = this.$.destinationHeight;

            if (!maxScale || !width || !height) {
                return;
            }

            var xFactor = width / this.width(1);
            var yFactor = height / this.height(1);

            if (maxScale.$.fixedAspectRatio) {
                this.$.maxScale.set(xFactor <= yFactor ? 'x' : 'y', Math.min(xFactor, yFactor));
            } else {
                this.$.maxScale.set('x', xFactor);
                this.$.maxScale.set('y', yFactor);
            }
        },

        adjustOffsetHandler: function(e) {
            var newScaleX = e.$.x;
            var oldScaleX = e.target.$previousAttributes['x'];

            var newScaleY = e.$.y;
            var oldScaleY = e.target.$previousAttributes['y'];
            this.adjustOffsetAfterScaling(oldScaleX, newScaleX, oldScaleY, newScaleY);
        },

        adjustOffsetAfterScaling: function(oldScaleX, newScaleX, oldScaleY, newScaleY) {
            if (this.$.initialized) {
                var offset = this.get('offset');
                if (newScaleX && oldScaleX) {
                    var desiredOffsetX = offset.get('x') + 0.5 * this.width(oldScaleX - newScaleX);
                    offset.set('x', Math.round(this.clamp(desiredOffsetX, 0, this.$.maxOffset.$.x)));
                }

                if (newScaleY && oldScaleY) {
                    var desiredOffsetY = offset.get('y') + 0.5 * this.height(oldScaleY - newScaleY);
                    offset.set('y', Math.round(this.clamp(desiredOffsetY, 0, this.$.maxOffset.$.y)));
                }
            }
        },

        //one scaleStep increases image one pixel increase for any dimension
        scaleStepX: function() {
            return 1 / this.width(1);
        }.onChange('htmlImage'),

        scaleStepY: function() {
            return 1 / this.height(1);
        }.onChange('htmlImage'),


        apply: function(ctx, source, options, callback) {
            if (!callback) {
                return;
            }

            options = options || {};
            var self = this;

            var img = source;
            if (source instanceof Design) {
                if (source.get('localHtmlImage')) {
                    img = source.get('localHtmlImage')
                } else {
                    callback(new Error('No localHtmlImage'));
                }
            }


            flow()
                .seq('maskimg', function(cb) {
                    self.initImage(null, cb);
                })
                .seq(function() {
                    self.combine(ctx, this.vars.maskimg, img, ctx.canvas.width, ctx.canvas.height, options);
                })
                .exec(callback);

        },

        combine: function(ctx, mask, img, width, height, options) {

            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            var oldCompositionOperation = ctx.globalCompositeOperation;

            var factor = options.fullSize ? 1 / this.canvasScalingFactor(img) : 1;
            ctx.drawImage(mask, this.$.offset.$.x * factor, this.$.offset.$.y * factor, this.width() * factor, this.height() * factor);
            ctx.globalCompositeOperation = 'source-in';
            ctx.drawImage(img, 0, 0, width, height);

            ctx.globalCompositeOperation = oldCompositionOperation;
        },

        compose: function() {
            var offset = this.$.offset;
            var scale = this.$.scale;
            return {
                id: this.$.id,
                'offset': {
                    x: offset.$.x,
                    y: offset.$.y
                },
                'scale': {
                    x: scale.$.x,
                    y: scale.$.y
                },
                'fixedAspectRatio': this.$.fixedAspectRatio
            };
        },

        id: function() {
            var baseId = this.callBase();
            return [baseId, this.$.offset.$.x, this.$.offset.$.y, this.$.scale.$.x, this.$.scale.$.y].join('#');
        }
    });
});