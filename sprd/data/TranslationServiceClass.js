define(["sprd/data/SprdDataSource", "js/data/RestDataSource", "underscore", "sprd/data/SprdModel", "js/data/Collection"],
    function (SprdDataSource, RestDataSource, _, SprdModel, Collection) {

        var Translation = SprdModel.inherit('sprd.model.Translation', {
            schema: {
            },

            idField: null,

            language: function () {
                return this.$.locale.split("_").shift()
            }
        });

        var SprdApiDataSource = SprdDataSource.inherit('sprd.data.TranslationServiceClass', {

            defaults: {
                locale: "en_EU",
                parsePayloadOnCreate: false,
                parsePayloadOnUpdate: false
            },

            translate: function (text, locale, targetLocales, callback) {

                this.createCollection(Collection.of(Translation)).fetch({
                    limit: targetLocales.length,
                    params: {
                        locale: locale,
                        targetLocales: targetLocales.join(","),
                        text: text
                    }
                }, callback);
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