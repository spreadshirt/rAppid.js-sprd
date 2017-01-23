define(["js/data/RestDataSource"], function(RestDataSource) {
    return RestDataSource.inherit({

        defaults: {
            language: null
        },

        getQueryParameters: function(method, resource) {
            var ret = this.callBase();

            var language = this.$.language;
            if (language) {
                ret = _.defaults(ret, {
                    language: language
                });
            }

            return ret;


        }

    });
});