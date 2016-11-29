define(['js/data/Entity', 'flow'], function(Entity, flow) {

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

            Image.getDimension(this.src, function(err, dimension) {
                if (!err && dimension) {
                    // set width and height
                    self.set(dimension);
                }

                callback(err, dimension);
            });
        }
    }, {
        getDimension: function(src, callback) {
            if (typeof window !== "undefined") {
                var img = new window.Image();
                img.onload = function(e) {
                    callback(null, {
                        width: img.width,
                        height: img.height
                    });
                };
                img.src = src;
            } else {
                callback("Cannot determinate dimension, window not defined");
            }
        },

        greyScale: function(img, shrinkFactor) {
            if (typeof document !== "undefined") {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                canvas.width = img.width * (shrinkFactor || 1);
                canvas.height = img.height * (shrinkFactor || 1);

                var i, avg;
                var filtersSupported = "filter" in ctx;

                var opacity = 0.2;
                if (filtersSupported) {
                    ctx.filter = "grayscale(100%) opacity(" + (opacity * 100) + "%)";
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                } else {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    for (i = 0; i < imgData.data.length; i += 4) {
                        avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
                        imgData.data[i] = avg;
                        imgData.data[i + 1] = avg;
                        imgData.data[i + 2] = avg;
                    }

                    for (i = 3; i < imgData.data.length; i += 4) {
                        imgData.data[i] *= opacity;
                    }

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.putImageData(imgData, 0, 0);
                }

                return canvas.toDataURL();
            } else {
                console.log("Global object document is not defined.");
            }

        },

        greyScaleImage: function(input, shrinkFactor, callback) {
            var factor = 1;
            if (typeof shrinkFactor === 'function') {
                callback = shrinkFactor;
            } else if (typeof shrinkFactor === 'number') {
                factor = shrinkFactor;
            }

            if (!callback) {
                return;
            }

            if (!input) {
                callback(new Error('No source supplied for greyscale conversion.'));
            }

            if (typeof window !== "undefined") {

                flow()
                    .seq('originalImg', function(cb) {
                        if (!(input instanceof window.Image)) {
                            var originalImg = new window.Image();
                            originalImg.onerror = cb;
                            originalImg.onload = function() {
                                cb(null, originalImg);
                            };

                            originalImg.src = input;
                        } else {
                            cb(null, input);
                        }
                    })
                    .seq('greyScaleImg', function(cb) {
                        var greyScale = new window.Image();
                        greyScale.onerror = cb;
                        greyScale.onload = function() {
                            cb(null, greyScale);
                        };

                        greyScale.src = Image.greyScale(this.vars.originalImg, factor);
                    })
                    .exec(function(err, results) {
                        if (!err) {
                            callback(null, results.greyScaleImg);
                        } else {
                            callback(err);
                        }
                    });
            }

            else {
                callback("Cannot create grey scale image, window not defined");
            }
        }
    });
    return Image;
});