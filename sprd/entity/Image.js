define(['js/data/Entity'], function (Entity) {

    var Image = Entity.inherit('sprd.entity.Image', {
        defaults: {
            name: null,
            size: null,
            type: null,
            lastModifiedDate: null,
            src: null,

            width: null,
            height: null
        },

        getDimension: function(callback) {
            var self = this;

            Image.getDimension(this.src, function (err, dimension) {
                if (!err && dimension) {
                    // set width and height
                    self.set(dimension);
                }

                callback(err, dimension);
            });
        }
    }, {
        getDimension: function (src, callback) {
            if (typeof window !== "undefined") {
                var img = new window.Image();
                img.onload = function (e) {
                    callback(null, {
                        width: img.width,
                        height: img.height
                    });
                };
                img.src = src;
            } else {
                callback("Cannot determinate dimension, window not defined");
            }
        }
    });
    return Image;
});