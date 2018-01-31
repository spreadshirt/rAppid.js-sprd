define(['js/core/Component', 'underscore'], function (Component, _) {

    var exceptionSizes = [120, 178],
        PRODUCT = "product",
        COMPOSITION = "composition";

    var ImageService = Component.inherit('sprd.data.ImageService', {

        defaults: {
            subDomainCount: 10,
            endPoint: '//image.spreadshirtmedia.net/image-server/v1',
            gateway: '/image-server/v1',

            designCache: {}
        },

        ctor: function() {
            this.callBase();
        },

        virtualProductImage: function(product, vpString, viewId, options) {
            return this.buildUrl([
                'products',
                vpString,
                'views',
                viewId
            ], ImageService.getImageSizeParameter(options));
        },

        productImage: function (productId, viewId, appearanceId, type, options) {
            var params = ImageService.getImageSizeParameter(options);
            if (appearanceId) {
                params.appearanceId = appearanceId;
            }

            if (options.mediaType) {
                params.mediaType = options.mediaType;
            }

            if (options.hideProductType) {
                params.noPt = true;
            }

            var urlParts = [
                type === PRODUCT ? "products" : "compositions",
                productId
            ];

            if (viewId != null) {
                urlParts.push("views", viewId);
            }

            return this.buildUrl(urlParts, params);
        },

        productTypeImage: function (productTypeId, viewId, appearanceId, options) {
            var parameter = _.defaults(ImageService.getImageSizeParameter(options), options);
            return this.buildUrl(['productTypes', productTypeId, 'views', viewId, 'appearances', appearanceId], parameter);
        },

        productTypeSizeImage: function (productTypeId, options) {
            return this.buildUrl(["productTypes", productTypeId, "variants", "size"], ImageService.getImageSizeParameter(options));
        },

        designImage: function (designId, options) {
            options = options || {};
            var parameter = ImageService.getImageSizeParameter(options) || {},
                startParameter = this.PARAMETER();

            var printColors = options.printColors;
            if (printColors) {
                for (var i = 0; i < printColors.length; i++) {
                    parameter["colors[" + i + "]"] = printColors[i];
                }
            }

            if (options.backgroundColor) {
                parameter.backgroundColor = options.backgroundColor;
            }

            if (options.version) {
                parameter.version = options.version;
            }

            if (options.sameOrigin) {
                parameter.sameOrigin = options.sameOrigin;
            }

            var url = ['designs', designId];

            if (startParameter.subMode == 'edit' && (options.watermark === undefined || options.watermark)) {
                url.unshift('mp');
            }

            return this.buildUrl(url, parameter);
        },

        designImageFromCache: function(designId, options) {
            // noinspection PointlessBooleanExpressionJS
            var cache = this.get("designCache"),
                size = options.width || options.height,
                key = designId + "-" + options.version + "-" + (!!options.watermark);

            if(options.layerIndex != null) {
                key += "-" + options.layerIndex;
            }

            var imageSrc = cache[key];

            if (imageSrc) {
                var currentSize = imageSrc.size || 0;

                if (currentSize >= size) {
                    return imageSrc.href;
                }
            }

            var href = this.designImage(designId, options);

            cache[key] = {
                size: size,
                href: href
            };

            return href
        },

        appearanceImage: function (appearanceId, options) {
            return this.buildUrl(['appearances', appearanceId], ImageService.getImageSizeParameter(options));
        },

        printColorImage: function (printColorId, options) {
            return this.buildUrl(['printColors', printColorId], ImageService.getImageSizeParameter(options));
        },

        emptyImage: function () {
            return "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
        },

        fontUrl: function (font, extension) {
            extension = extension || "woff" || "svg#font";
            return ImageService.buildUrl([this.$.gateway,'fontFamilies', font.getFontFamily().$.id, 'fonts', font.$.id], null, extension);
        },

        buildUrl: function (url, parameter) {
            var imgServer = this.$.endPoint;
            delete parameter.sameOrigin;

            url = url || [];
            url.unshift(imgServer);

            return ImageService.buildUrl(url, parameter, 'png');
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

    ImageService.buildUrl = function (url, parameter, extension) {
        var queryString = ImageService.buildQueryString(parameter);
        return url.join('/') + (queryString ? ',' + queryString : '') + (extension ? '.' + extension : '');
    };

    ImageService.buildQueryString = function (parameter) {
        var ret = [];

        for (var key in parameter) {
            if (parameter.hasOwnProperty(key)) {
                ret.push(key + '=' + encodeURIComponent(parameter[key]));
            }
        }

        if (ret.length) {
            return ret.join(',');
        }
    };

    ImageService.ProductImageType = {
        PRODUCT: PRODUCT,
        COMPOSITION: COMPOSITION
    };

    return ImageService;

});
