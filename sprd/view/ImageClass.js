define(["js/ui/View", "underscore", "sprd/data/ImageService"], function(View, _, ImageService) {

    return View.inherit({

        defaults: {
            componentClass: 'sprd-image',
            /***
             * the loading state
             * @type Boolean
             */
            loaded: false,

            /***
             * indicator if image has a loading error
             * @type Boolean
             */
            loadingError: false,

            /***
             * the width of the Image
             * @type Number
             */
            width: null,

            /***
             * the height of the Image
             * @type Number
             */
            height: null,

            /***
             * the source of the Image
             * @type String
             */
            src: null,

            /***
             * the title of the Image
             * @type String
             */
            title: null
        },

        /***
         * event handler dispatched after the image has been loaded
         */
        _onLoad: function () {
            this.set('loaded', true);
        },

        _onError: function() {
            this.set({
                loadingError: true,
                loaded: true
            });
        },

        /***
         * the spreadshirt image server provides images in normalized sizes between
         * 50px and 1200px within 50px steps.
         *
         * @param {String} url - the url of the image
         * @return {String} the url extended with normalized sizes
         */
        extendUrlWithSizes: function (url) {
            if (this.$.width) {
                url += ",width=" + ImageService.normalizeImageSize(this.$.width);
            }

            if (this.$.height) {
                url += ",height=" + ImageService.normalizeImageSize(this.$.height);
            }

            return url;
        },

        /***
         * returns the `src`
         * @return {String}
         */
        imageUrl: function () {
            return this.$.src;
        }.onChange('src'),

        _renderLoaded: function (loaded) {
            if (loaded) {
                this.removeClass('loading');
            } else {
                this.addClass('loading');
            }
        },

        _renderLoadingError: function (error) {
            if (error) {
                this.addClass('loading-error');
            } else {
                this.removeClass('loading-error');
            }
        },

        /***
         * returns the alternative description of the image if the image cannot be loaded
         * @return {String}
         */
        alt: function () {
            return this.$.title;
        }
    });

});