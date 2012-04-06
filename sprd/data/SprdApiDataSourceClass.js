var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("sprd.data.SprdApiDataSourceClass", ["js.data.RestDataSource"], function (RestDataSource) {

        var SprdApiContext = RestDataSource.RestContext.inherit({
            getQueryParameter: function () {

                var parameter = {
                    mediaType: "json"
                };

                if (this.$properties && this.$properties.locale) {
                    parameter.locale = this.$properties.locale;
                }

                return rAppid._.defaults(parameter, this.callBase());
            }
        });

        var ShopContext = SprdApiContext.inherit({
            // some sugar for the developer here
            getPathComponents: function () {
                return ['shops', this.$properties.shopId];
            }
        });

        var UserContext = SprdApiContext.inherit({
            // some sugar for the developer here
            getPathComponents: function () {
                return ['users', this.$properties.userId];
            }
        });

        var contextParameterExtractor = /.*(shops|users)\/(\d+)\/.+$/i;

        return RestDataSource.inherit({

            ctor: function () {
                this.callBase();
            },

            defaults: {
                endPoint: "http://api.spreadshirt.net/api/v1",
                gateway: "api",
                apiKey: null,
                secret: null,
                collectionPageSize: 100
            },

            initialize: function () {
                this.callBase();

                if (!this.$.apiKey) {
                    console.log("No apiKey for SprdApiDataSource definied");
                }
            },

            createContext: function (properties, parentContext) {

                if (properties) {
                    if (properties.shopId) {
                        return new ShopContext(this, properties, parentContext);
                    }

                    if (properties.userId) {
                        return new UserContext(this, properties, parentContext);
                    }
                }

                return new SprdApiContext(this, properties, parentContext);
            },

            createContextCacheId: function (properties, parentProperties) {
                // only use locale from parentProperties
                var parent = {};
                if (parentProperties && parentProperties.locale) {
                    parent.locale = parentProperties.locale;
                }
                
                return this.callBase(properties, parent);
            },

            getContextPropertiesFromReference: function (reference) {

                var match = contextParameterExtractor.exec(reference);
                if (match) {
                    if (match[1] == "shops") {
                        return {
                            shopId: match[2]
                        };
                    }

                    if (match[1] == "users") {
                        return {
                            userId: match[2]
                        }
                    }
                }

                return null;
            },

            getQueryParams: function () {
                return rAppid._.defaults({
                    mediaType: "json"
                }, this.callBase());
            },


            extractListMetaData: function (list, payload, options) {
                return payload;
            },

            extractListData: function (list, payload, options) {
                for (var key in payload) {
                    if (payload.hasOwnProperty(key)) {
                        if (rAppid._.isArray(payload[key])) {
                            return payload[key];
                        }
                    }
                }
            },

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
            },
            root: function() {
                return this.getContext();
            }
        });
    })
    ;
})
;