define([], function () {
    var rectCache = {},
        canvas;
    
    return {

        toImage: function (url, callback) {
            var image = new Image();
            image.onload = function () {
                callback && callback(null, image);
            };
            image.onerror = function (err) {
                callback && callback(err);
            };
            image.src = url
        },

        getCtx: function (width, height) {
            canvas = canvas || document.createElement('canvas');
            var maxDim = Math.max(width, height);
            canvas.width = maxDim;
            canvas.height = maxDim;
            
            return canvas.getContext('2d');
        },

        getRealDesignSize: function (image, rotation) {
            if (!image) {
                return;
            }

            var cacheKey = image.src + rotation;
            if (rectCache[cacheKey]) {
                return rectCache[cacheKey];
            }

            var ctx = this.getCtx(image.naturalWidth, image.naturalHeight),
                canvas = ctx.canvas,
                startX = (canvas.width - image.naturalWidth)/2,
                startY = (canvas.height - image.naturalHeight)/2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(image, startX - canvas.width/ 2, startY - canvas.height / 2);

            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            var rect = this.getRectFromImageData(imageData);
            rectCache[cacheKey] = rect;
            return rect;
        },

        getRectFromImageData: function (data) {
            if (!data || !data.width || !data.height) {
                return;
            }

            var width = data.width,
                height = data.height,
                pixelArray = data.data;


            var minX = width, minY = height, maxX = 0, maxY = 0;


            for (var i = 0; i < height; i++) {
                for (var j = 0; j < width; j++) {
                    var index = this.transformPointToIndex(j, i, width),
                        aVal = pixelArray[index + 3],
                        isTransparent = aVal === 0;

                    if (!isTransparent) {
                        minX = Math.min(j, minX);
                        minY = Math.min(i, minY);
                        maxY = Math.max(i, maxY);
                        maxX = Math.max(j, maxX);
                    }
                }
            }

            return {
                x: minX / width,
                y: minY / height,
                width: (maxX - minX) /width,
                height: (maxY - minY)/ height
            }


        },

        transformPointToIndex: function (x, y, width) {
            return 4 * (y * width + x);
        }
    }
});