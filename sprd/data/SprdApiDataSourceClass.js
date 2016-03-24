define(["sprd/data/SprdDataSource", "js/data/DataSource", "js/data/RestDataSource", "underscore", "sprd/data/SprdModel", "sprd/model/processor/DefaultProcessor", "sprd/model/processor/BasketProcessor", "sprd/model/processor/BasketItemProcessor", "sprd/data/SprdApiQueryComposer", "sprd/model/processor/UploadDesignProcessor"],
    function (SprdDataSource, DataSource, RestDataSource, _, SprdModel, DefaultProcessor, BasketProcessor, BasketItemProcessor, SprdApiQueryComposer, UploadDesignProcessor) {

        var _formatProcessorCache = {},
            REMOTE = 'remote',
            ImageFormatProcessor = DataSource.FormatProcessor.inherit({

                ctor: function(type, format) {
                    this.$type = type;
                    this.$format = format;

                    this.callBase();
                },

                serialize: function(data) {

                    if (this.$format == REMOTE) {
                        return {
                            href: data.image.src
                        };
                    }

                    var ret = new FormData();
                    ret.append('filedata', data.image.file);
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
                parsePayloadOnCreate: false,
                parsePayloadOnUpdate: false,
                keepRawData: false
            },

            $defaultProcessorFactory: DefaultProcessor,

            $processors: {
                BasketProcessor: BasketProcessor,
                BasketItemProcessor: BasketItemProcessor,
                OrderItemProcessor: BasketItemProcessor,
                UploadDesignProcessor: UploadDesignProcessor
            },

            getQueryParameters: function (method, resource) {
                var ret = _.defaults({
                    mediaType: "json"
                }, this.callBase());

                if (resource.constructor.name.indexOf("Label") > -1) {
                    ret.fullData = true
                }
                return ret;

            },

            getFormatProcessor: function(action, model) {

                if (model && model.factory.prototype.constructor.name == "sprd.model.DesignUpload") {
                    var type = model.$.image.$.type,
                        format = model.$.image.$.file ? "file" : REMOTE,
                        cacheId = type + "_" + format;

                    if (!_formatProcessorCache[cacheId]) {
                        _formatProcessorCache[cacheId] = new ImageFormatProcessor(type, format);
                    }

                    return _formatProcessorCache[cacheId];
                }

                return this.callBase();
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