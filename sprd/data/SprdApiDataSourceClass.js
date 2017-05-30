define(["sprd/data/SprdDataSource", "js/data/DataSource", "js/data/RestDataSource", "underscore", "sprd/data/SprdModel", "sprd/model/processor/DefaultProcessor", "sprd/model/processor/BasketProcessor", "sprd/model/processor/BasketItemProcessor", "sprd/data/SprdApiQueryComposer", "sprd/model/processor/UploadDesignProcessor", "JSON"],
    function (SprdDataSource, DataSource, RestDataSource, _, SprdModel, DefaultProcessor, BasketProcessor, BasketItemProcessor, SprdApiQueryComposer, UploadDesignProcessor, JSON) {

        var _formatProcessorCache = {},
            REMOTE = 'remote',
            rIdExtractor = /\/([^/]+)$/,
            ImageFormatProcessor = DataSource.FormatProcessor.inherit({

                ctor: function(type, format) {
                    this.$type = type;
                    this.$format = format;

                    this.callBase();
                },

                serialize: function(data) {

                    if (this.$format == REMOTE) {
                        return JSON.stringify({
                            href: data.image.src
                        });
                    }

                    var ret = new FormData();
                    if (data.image.file) {
                        ret.append('filedata', data.image.file);
                    } else if (data.image.blob) {
                        ret.append('filedata', data.image.blob, data.image.filename);
                    }

                    return ret;
                },

                getContentType: function() {
                    if (this.$format === REMOTE) {
                        return "application/json";
                    }

                    return false;
                }
            });

        var SprdApiDataSource = SprdDataSource.inherit('sprd.data.SprdApiDataSourceClass', {

            defaults: {
                locale: "en_EU",
                currencyId: null,
                parsePayloadOnCreate: false,
                parsePayloadOnUpdate: false,
                keepRawData: false,
                noCache: false,
                mode: null
            },

            $defaultProcessorFactory: DefaultProcessor,

            $processors: {
                BasketProcessor: BasketProcessor,
                BasketItemProcessor: BasketItemProcessor,
                OrderItemProcessor: BasketItemProcessor,
                UploadDesignProcessor: UploadDesignProcessor
            },

            loadModel: function(model, options, callback) {

                if (this.$.noCache && options && !options.hasOwnProperty('noCache')) {
                    options.noCache = true;
                }

                model.options = options;
                var ret = this.callBase(model, options, callback);
                delete model.options;

                return ret;
            },

            _buildUriForResource: function(resource) {
                var uri = this.callBase();

                var options = resource.options;
                if (options && options.fetchInShop) {
                    uri = uri.replace(/\/(users|shops)\/\d+\//, "/shops/" + options.fetchInShop + "/");
                }

                return uri;
            },

            loadCollectionPage: function(collectionPage, options, callback) {
                if (this.$.noCache && options && !options.hasOwnProperty('noCache')) {
                    options.noCache = true;
                }

                return this.callBase(collectionPage, options, callback);
            },

            getQueryParameters: function (method, resource) {

                var currency = {};
                var currencyId = this.$.currencyId;

                if (currencyId) {
                    currency.currencyId = currencyId;
                }

                var ret = _.defaults({
                    mediaType: "json"
                }, currency, this.callBase());

                var resourceName = resource.constructor.name;
                if (/\bProduct\b/.test(resourceName)) {
                    _.defaults(ret, {
                        mode: "designer"
                    });
                }

                var mode = this.$.mode;

                if (mode && !(/\bCollection\b/.test(resourceName) && /\bDesign(Category)?\b/i.test(resourceName))) {
                    ret = _.defaults(ret, {
                        mode: mode
                    });
                }

                if (resourceName.indexOf("Label") > -1) {
                    ret.fullData = true
                }
                return ret;

            },

            getFormatProcessor: function(action, model) {

                if (model && model.factory.prototype.constructor.name == "sprd.model.DesignUpload") {
                    var type = model.$.image.$.type,
                        format = model.$.image.$.file || model.$.image.$.blob ? "file" : REMOTE,
                        cacheId = type + "_" + format;

                    if (!_formatProcessorCache[cacheId]) {
                        _formatProcessorCache[cacheId] = new ImageFormatProcessor(type, format);
                    }

                    return _formatProcessorCache[cacheId];
                }

                return this.callBase();
            },

            extractIdFromLocation: function(location, request) {
                var param = rIdExtractor.exec(location);

                if (param) {
                    return param[1];
                }

                return null;
            },

            createContext: function (contextModel, properties, parentContext) {
                return new SprdApiDataSource.SprdApiContext(this, contextModel, properties, parentContext);
            },

            getQueryComposer: function () {
                return SprdApiQueryComposer;
            },

            _getContextPath: function (data) {
                var match = /\/api\/v1\/(.*)$/.exec(data[this.$.determinateContextAttribute]);

                if (match) {
                    return match[1];
                }

                return this.callBase();
            },

            _parsePayloadOnUpdate: function (request, xhr) {

                var model = request.model;
                var configuration = this.$dataSourceConfiguration.getConfigurationForModelClass(model.factory);

                if (configuration.$.parseResponse === true) {
                    return true;
                }

                return this.callBase();
            },

            /***
             * returns the context for the shop
             *
             * @param {String} [shopId]
             * @param [locale]
             * @return {RestDataSource.Context}
             */
            shop: function (shopId, locale) {

                shopId = shopId || this.$.shopId;
                locale = locale || this.$.locale;

                var properties = {
                    shopId: shopId
                };

                if (locale) {
                    properties.locale = locale;
                }

                return this.getContext(properties);
            },

            /***
             *
             * returns the context for the user
             *
             * @param [userId]
             * @param [locale]
             * @return {RestDataSource.Context}
             */
            user: function (userId, locale) {
                userId = userId || this.$.shopId;
                locale = locale || this.$.locale;


                var properties = {
                    userId: userId
                };

                if (locale) {
                    properties.locale = locale;
                }

                return this.getContext(properties);
            }

        });

        SprdApiDataSource.SprdApiContext = RestDataSource.RestContext.inherit({
            getQueryParameters: function () {

                var parameter = {
                    mediaType: "json"
                };

                if (this.$properties && this.$properties.locale) {
                    parameter.locale = this.$properties.locale;
                }

                return _.defaults(parameter, this.callBase());
            }
        });

        return SprdApiDataSource;
    });