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
            var canvasSize = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
            canvas.width = canvasSize;
            canvas.height = canvasSize;

            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return ctx;
        },

        getRealDesignSize: function (image, rotation, width, height) {
            if (!image) {
                return;
            }

            width = width || image.naturalWidth;
            height = height || image.naturalHeight;

            var cacheKey = image.src + rotation;
            if (rectCache[cacheKey]) {
                return rectCache[cacheKey];
            }

            var ctx = this.getCtx(width, height),
                canvas = ctx.canvas,
                startX = (canvas.width - width) / 2,
                startY = (canvas.height - height) / 2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(image, startX - canvas.width / 2, startY - canvas.height / 2);

            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var corners = this.getCornersFromImageData(imageData);
            corners = this.translateCorners(corners, canvas.width, canvas.height, width, height);
            var rect = this.getRectFromCorners(corners, width, height);

            rectCache[cacheKey] = rect;
            
            return rect;
        },

        getCornersFromImageData: function (data) {
            if (!data || !data.width || !data.height) {
                return;
            }

            var width = data.width,
                height = data.height,
                pixelArray = data.data;

            var minX = width, minY = height, maxX = 0, maxY = 0;


            for (var i = 0; i < data.height; i++) {
                for (var j = 0; j < data.width; j++) {
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
                minX: minX,
                minY: minY,
                maxX: maxX,
                maxY: maxY
            }
        },

        translateCorners: function (corners, oldWidth, oldHeight, newWidth, newHeight) {
            var widthDelta = oldWidth - newWidth,
                heightDelta = oldHeight - newHeight;

            return {
                minX: corners.minX - widthDelta / 2,
                minY: corners.minY - heightDelta / 2,
                maxX: corners.maxX - widthDelta / 2,
                maxY: corners.maxY - heightDelta / 2
            }
        },

        getRectFromCorners: function (corners, width, height) {
            return {
                x: corners.minX / width,
                y: corners.minY / height,
                width: (corners.maxX - corners.minX) / width,
                height: (corners.maxY - corners.minY) / height
            }
        },

        transformPointToIndex: function (x, y, width) {
            return 4 * (y * width + x);
        }
    }
});