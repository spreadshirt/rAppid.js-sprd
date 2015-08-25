define(['js/core/Component', 'underscore'], function (Component, _) {

    var exceptionSizes = [120, 178],
        PRODUCT = "product",
        COMPOSITION = "composition";

    var ImageService = Component.inherit('sprd.data.ImageService', {

        defaults: {
            subDomainCount: 10,
            endPoint: '//image.spreadshirt.net/image-server/v1',
            gateway: '/image-server/v1',

            detectWebP: true,

            supportsWebP: false
        },

        ctor: function() {
            this.callBase();

            if (this.$.detectWebP) {
                var self = this;

                var image = new Image();
                image.onerror = function() {
                    self.set("supportsWebP", false);
                };
                image.onload = function() {
                    self.set("supportsWebP", image.width == 1);
                };

                image.src = 'data:image/webp;base64,UklGRiwAAABXRUJQVlA4ICAAAAAUAgCdASoBAAEAL/3+/3+CAB/AAAFzrNsAAP5QAAAAAA==';
            }
        },

        virtualProductImage: function(product, vpString, viewId, options) {
            return this.buildUrl([
                'products',
                vpString,
                'views',
                viewId
            ], ImageService.getImageSizeParameter(options), parseInt(product ? product.$.id : 0));
        },

        productImage: function (productId, viewId, appearanceId, type, options) {
            var params = ImageService.getImageSizeParameter(options);
            if (appearanceId) {
                params.appearanceId = appearanceId;
            }
            return this.buildUrl([
                type === PRODUCT ? "products" : "compositions",
                productId,
                "views",
                viewId
            ],
                params,
            parseInt(productId || 0) + parseInt(viewId || 0) + parseInt(appearanceId || 0));
        },

        productTypeImage: function (productTypeId, viewId, appearanceId, options) {
            return this.buildUrl(['productTypes', productTypeId, 'views', viewId, 'appearances', appearanceId],
                ImageService.getImageSizeParameter(options), parseInt(productTypeId || 0) + parseInt(viewId || 0) + parseInt(appearanceId || 0));
        },

        productTypeSizeImage: function (productTypeId, options) {
            return this.buildUrl(["productTypes", productTypeId, "variants", "size"], ImageService.getImageSizeParameter(options), productTypeId);
        },

        designImage: function (designId, options) {
            options = options || {};
            var parameter = ImageService.getImageSizeParameter(options) || {};

            var printColors = options.printColors;
            if (printColors) {
                for (var i = 0; i < printColors.length; i++) {
                    parameter["colors[" + i + "]"] = printColors[i];
                }
            }

            if (options.version) {
                parameter.version = options.version;
            }

            var cacheId = options.cacheId || (designId || "").replace(/^.*?(\d+).*/, "$1");
            return this.buildUrl(['designs', designId], parameter, cacheId);
        },

        appearanceImage: function (appearanceId, options) {
            return this.buildUrl(['appearances', appearanceId], ImageService.getImageSizeParameter(options), appearanceId);
        },

        printColorImage: function (printColorId, options) {
            return this.buildUrl(['printColors', printColorId], ImageService.getImageSizeParameter(options), printColorId);
        },

        emptyImage: function () {
            return "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
        },

        fontUrl: function (font, extension) {
            extension = extension || "woff" || "svg#font";
            return ImageService.buildUrl([this.$.gateway,'fontFamilies', font.getFontFamily().$.id, 'fonts', font.$.id + "." + extension]);
        },

        buildUrl: function (url, parameter, cacheId) {
            var imgServer,
                subDomainCount = this.$.subDomainCount;

            if (!isNaN(parseInt(cacheId))) {
                // use the full qualified endpoint
                imgServer = this.$.endPoint;
                imgServer = imgServer.replace(/(\/\/image)\./, '$1' + (cacheId % subDomainCount) + ".");
            } else {
                imgServer = this.$.gateway;
            }

            url = url || [];
            url.unshift(imgServer);

            if (this.$.supportsWebP) {
                parameter = parameter || {};
                parameter.mediaType = parameter.mediaType || "webp";
            }

            return ImageService.buildUrl(url, parameter);
        }
    });

    ImageService.exceptionalSizes = [120, 178];

    ImageService.normalizeImageSize = function (size) {

        if (_.indexOf(exceptionSizes, size) === -1) {
            // normalize size
            size = Math.ceil(size / 50) * 50;
        }

        // keep range
        return Math.max(50, Math.min(1200, size));
    };

    ImageService.getImageSizeParameter = function (options) {

        options = options || {};

        var ret = {};

        if (options.width) {
            ret.width = ImageService.normalizeImageSize(options.width);
        }

        if (options.height) {
            ret.height = ImageService.normalizeImageSize(options.height);
        }

        return ret;
    };

    ImageService.buildUrl = function (url, parameter) {
        var queryString = ImageService.buildQueryString(parameter);
        return url.join('/') + (queryString ? '?' + queryString : '');
    };

    ImageService.buildQueryString = function (parameter) {
        var ret = [];

        for (var key in parameter) {
            if (parameter.hasOwnProperty(key)) {
                ret.push(key + '=' + encodeURIComponent(parameter[key]));
            }
        }

        if (ret.length) {
            return ret.join('&');
        }
    };

    ImageService.ProductImageType = {
        PRODUCT: PRODUCT,
        COMPOSITION: COMPOSITION
    };

    return ImageService;

});
