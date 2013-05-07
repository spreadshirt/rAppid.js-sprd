define(['sprd/entity/Image', 'underscore'], function(Image, _) {

    return Image.inherit('sprd.entity.RemoteImage', {

        schema: {
            src: Object
        },

        _commitSrc: function(src) {
            if (src && !this.$.name) {
                var match = /\/(.+?)$/.exec(src);
                if (match) {
                    this.set('name', match[1]);
                }
            }
        }
    });
});