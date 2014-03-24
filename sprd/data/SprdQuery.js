define(["js/data/Query", "underscore"], function(Query, _) {

    return Query.inherit({

        whereCacheId: function() {
            return (this.callBase() || "") + this.extraCacheId()
        },

        extraCacheId: function() {
            var extra = this.query.extra || {},
                cacheId = "";

            var keys = _.keys(extra).sort();

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                cacheId += (key + "=" + extra[key]);
            }

            return cacheId;

        }
    });
});