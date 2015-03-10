define(["js/ui/View", "underscore", "sprd/data/ImageService"], function (View, _, ImageService) {

    var lazyImages = [];

    function unveilImage(image) {
        var w = image.$stage.$window;
        var wt = w.scrollY,
            wb = wt + w.outerHeight;
        var boundingClientRect = image.$el.getBoundingClientRect(),
            et = boundingClientRect.top,
            eb = et + boundingClientRect.height,
            threshold = image.$.loadLazyThreshold || 0;

        if (eb >= wt - threshold && et <= wb + threshold) {
            image.unveil();
            return true;
        } else {
            return false;
        }
    }

    function unveilImages() {


        for (var i = lazyImages.length - 1; i >= 0; i--) {
            var image = lazyImages[i];
            if (unveilImage(image)) {
                lazyImages.splice(i, 1);
            }
        }
    }

    return View.inherit({

        defaults: {
            componentClass: 'sprd-image',

            /**
             * Set to true to load images only when in viewport
             * @type Boolean
             *
             */
            loadLazy: false,

            /**
             * Returns true if image is unveiled
             * @type Boolean
             *
             */
            unveiled: false,

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
            src: "{imageUrl()}",

            /***
             * the title of the Image
             * @type String
             */
            title: null,
            /**
             * Lazy Load threshold
             */
            loadLazyThreshold: 0
        },

        /***
         * event handler dispatched after the image has been loaded
         */
        _onLoad: function () {
            this.set('loaded', true);
        },

        _onError: function () {
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
            return null;
        },

        _onDomAdded: function () {
            this.callBase();

            unveilImages();
        },

        _renderLoadLazy: function (loadLazy) {

            if (loadLazy) {
                if (lazyImages.indexOf(this) === -1) {
                    lazyImages.push(this);
                }
                if (!this.factory.$unveil) {
                    this.factory.$unveil = unveilImages;
                    this.dom(this.$stage.$window).bindDomEvent("scroll", unveilImages);
                    this.dom(this.$stage.$window).bindDomEvent("resize", unveilImages);
                }
            } else {
                var i = lazyImages.indexOf(this);
                if (i > -1) {
                    lazyImages.splice(i, 1);
                }
            }
        },

        _isImageVisible: function () {
            return !this.$.loadLazy || this.$.unveiled;
        },

        unveil: function () {
            this.set('unveiled', true);
            if (this.isRendered()) {
                this._renderSrc(this.$.src);
            }
        },


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

        _renderSrc: function (src) {
            if (this._isImageVisible()) {
                this.$.$img.set('src', src);
            } else {
                this.$.$img.set('src', null);
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