define(["xaml!js/ui/AutoSuggestionBox", "xaml!sprd/data/SprdApiDataSource", "JSON", "rAppid"], function (AutoCompleteBox, SprdApiDataSource, JSON, rAppid) {

    return AutoCompleteBox.inherit("sprd.view.AutoSuggestionSearch", {

        defaults: {
            locale: null
        },

        _search: function (searchTerm, callback) {
            var locale = this.$.locale;

            if (locale) {
                rAppid.ajax("/api/v1/tags?locale=" + locale + "&prefix=" + searchTerm + "&simple=true", null, function (err, result) {
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