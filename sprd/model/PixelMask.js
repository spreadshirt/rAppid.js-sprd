define(["sprd/model/Mask"], function(Mask) {

    return Mask.inherit("sketchomat.model.PixelMask", {

        defaults: {
            image: null,
            preview: null
        },

        initImage: function(options, callback) {
            options = options || {};

            if (!this.get('image')) {
                callback && callback(null, null);
            }

            if (!options.force && this.get('htmlImage') && this.get('htmlImage').complete) {
                callback && callback(null, this.get('htmlImage'));
            }

            var self = this;
            var img = new Image();

            img.onload = function() {
                self.set('htmlImage', img);
                callback && callback(null, img);
            };

            img.onerror = function(e) {
                callback && callback(e);
            };

            img.src = this.get('image');
        },

        previewUrl: function() {
            return this.$.preview || this.$.image;
        }.onChange('image', 'preview')
    });
});