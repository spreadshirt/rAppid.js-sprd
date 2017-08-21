define(["sprd/model/AfterEffect", "sprd/model/Design"], function(AfterEffect, Design) {
    return AfterEffect.inherit("sketchomat.model.Frame", {
        defaults: {
            image: null
        },

        ctor: function() {
            this.callBase();
            this.initImage();
        },

        initImage: function() {
            if (!this.get('image')) {
                return;
            }

            var self = this;
            var img = new Image();

            img.onload = function() {
                self.set('htmlImage', img);
            };

            img.onerror = function(e) {
                console.error(e);
            };

            img.src = this.get('image');
        },

        apply: function(source, ctx, options, callback) {

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

            var frame = this.get('htmlImage');
            if (!this.get('vector')) {
                callback(null, img.src);
            } else if (!frame) {
                callback(new Error('frame image not loaded yet'));
            } else {
                self.combine(ctx, frame, img, ctx.canvas.width, ctx.canvas.height, options);
                callback(null);
            }

        },

        combine: function(ctx, frame, img, width, height) {
            var oldCompositionOperation = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(img, 0, 0, width, height);
            ctx.drawImage(frame, 0, 0, width, height);
            ctx.globalCompositeOperation = oldCompositionOperation;
        }
    })
});