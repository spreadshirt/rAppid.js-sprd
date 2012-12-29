define(["sprd/data/SprdDataSource", "js/data/RestDataSource", "underscore", "sprd/data/SprdModel", "sprd/model/processor/DefaultProcessor", "sprd/model/processor/BasketProcessor", "sprd/model/processor/BasketItemProcessor"],
    function (SprdDataSource, RestDataSource, _, SprdModel, DefaultProcessor, BasketProcessor, BasketItemProcessor) {

        var SprdApiDataSource = SprdDataSource.inherit('sprd.data.SprdApiDataSource', {

            defaults: {
                locale: "en_EU",
                parsePayloadOnCreate: false,
                parsePayloadOnUpdate: false
            },

            $defaultProcessorFactory: DefaultProcessor,

            $processors: {
                BasketProcessor: BasketProcessor,
                BasketItemProcessor: BasketItemProcessor
            },

            getQueryParameter: function (method, resource) {
                return _.defaults({
                    mediaType: "json"
                }, this.callBase());
            },

            createContext: function (contextModel, properties, parentContext) {
                return new SprdApiDataSource.SprdApiContext(this, contextModel, properties, parentContext);
            },

            _getContextPath: function(data) {
                var match = /\/api\/v1\/(.*)$/.exec(data[this.$.determinateContextAttribute]);

                if (match) {
                    return match[1];
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
            getQueryParameter: function () {

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