define(['js/core/Component','underscore'], function(Component, _) {

    var $exceptionSizes = [120, 178];

    var ImageService = Component.inherit('sprd.data.ImageService', {

        defaults: {
            endPoint: '//image.spreadshirt.net/image-server/v1'
        },

        productTypeImage: function (productTypeId, viewId, appearanceId, options) {
            return this.buildUrl(['productTypes', productTypeId, 'views', viewId, 'appearances', appearanceId],
                ImageService.getImageSizeParameter(options));
        },

        buildUrl: function(url, parameter) {
            url = url || [];
            url.unshift(this.$.endPoint);

            return ImageService.buildUrl(url, parameter);
        }
    });

    ImageService.exceptionalSizes = [120, 178];

    ImageService.normalizeImageSize = function (size) {

        if (_.indexOf($exceptionSizes, size) === -1) {
            // normalize size
            size = Math.ceil(size / 50) * 50;
        }

        // keep range
        return Math.max(50, Math.min(1200, size));
    };

    ImageService.getImageSizeParameter = function (options) {

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

    ImageService.buildQueryString = function(parameter) {
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

    return ImageService;

});