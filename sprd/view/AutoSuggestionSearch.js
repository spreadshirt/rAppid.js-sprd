define(["xaml!js/ui/AutoSuggestionBox", "xaml!sprd/data/SprdApiDataSource", "JSON", "rAppid"], function (AutoCompleteBox, SprdApiDataSource, JSON, rAppid) {

    return AutoCompleteBox.inherit("sprd.view.AutoSuggestionSearch", {

        inject: {
            api: SprdApiDataSource
        },

        _search: function (searchTerm, callback) {
            var locale = this.$stage.$parameter.locale;
            if (locale) {
                rAppid.ajax("/tag-service/sprd-tags/tags?locale=" + locale + "&prefix=" + searchTerm + "&simple=true", null, function (err, result) {
                    var data = null;
                    if (!err) {
                        try {
                            data = JSON.parse(result.responses.text);
                        } catch (e) {
                            err = e;
                        }
                    }

                    callback && callback(err, data);
                });
            }
        }

    });

});