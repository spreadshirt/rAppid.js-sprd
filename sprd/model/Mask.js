define(["sprd/model/AfterEffect", 'sprd/model/MaskApplier', "sprd/model/Design", "sprd/entity/Offset", "js/core/Base", "sprd/entity/Scale", "flow", "rAppid"], function(AfterEffect, MaskApplier, Design, Offset, Base, Scale, flow, rappid) {

    return AfterEffect.inherit("sprd.model.Mask", {
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

        _initializationComplete: function () {
            this.callBase();
            this.initDefaults();
            this.initBindings();
        },

        getApplier: function () {
            var offset = this.get('offset'),
                applier = this.createEntity(MaskApplier);

            applier.set({
                transformX: offset.$.x,
                transformY: offset.$.y,
                maskWidth: this.width(),
                maskHeight: this.height()
            });

            return applier;
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

        clamp: function(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },

        initImage: function(options, callback) {
            options = options || {};

            if (!options.force && this.get('htmlImage') && this.get('htmlImage').complete) {
                return callback && callback(null, this.get('htmlImage'));
            }

            var img = new Image(),
                self = this;

            img.onload = function() {
                self.set('htmlImage', img);
                callback && callback(null, img);
            };

            img.onerror = function(e) {
                callback && callback(e);
            };

            img.src = this.relativePreviewUrl(options.width);
        },

        centerAt: function(x, y, options) {
            var newX, newY;

            options = options || {};

            newX = x;
            newY = y;

            if (options.relative) {
                if (!this.$.destinationWidth || !this.$.destinationHeight) {
                    this.log('Cannot center mask. No destination dimensions set', Base.LOGLEVEL.ERROR);
                    return;
                }

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
                    var startFactor = Math.min(width / originalWidth, height / originalHeight) * 0.9;
                    this.$.scale.set('y', startFactor);
                    this.$.scale.set('x', startFactor);
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
                if (source.get('htmlImage')) {
                    img = source.get('htmlImage')
                } else {
                    callback(new Error('No htmlImage'));
                }
            }


            flow()
                .seq('maskimg', function(cb) {
                    self.initImage(null, cb);
                })
                .seq(function() {
                    self.combine(ctx, this.vars.maskimg, img, ctx.canvas.width, ctx.canvas.height);
                })
                .exec(callback);

        },

        combine: function(ctx, mask, img, width, height) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            var oldCompositionOperation = ctx.globalCompositeOperation;

            ctx.drawImage(mask, this.$.offset.$.x, this.$.offset.$.y , this.width() , this.height());
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