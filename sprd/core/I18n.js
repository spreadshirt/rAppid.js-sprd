define(["js/core/I18n", "rAppid", "flow", "JSON"], function(I18n, rAppid, flow, JSON) {

    return I18n.inherit({
        t: function(num, key) {

            if (_.isNumber(num) && num > 1) {

                var args = Array.prototype.slice.call(arguments);
                key = args.shift();

                if (key > 5) {
                    key = args.shift();
                    return I18n.prototype.t.apply(this, [key + "_large_plural"].concat(args)) || I18n.prototype.t.apply(this, [key + "_plural"].concat(args))
                }

                key = args.shift();
                return I18n.prototype.t.apply(this, [key + "_plural"].concat(args));

            }

            return this.callBase();

        }.onChange("translations"),

        loadLocale: function(locale, callback) {

            var self = this;

            if (!locale) {
                callback && callback("locale not defined");
                return;
            }

            flow()
                .seq("ajax", function(cb) {
                    rAppid.ajax(self.baseUrl(self.$.path + "/" + locale + ".json"), null, cb);
                })
                .seq(function() {
                    var translations = JSON.parse(this.vars.ajax.responses.text);

                    self.set({
                        translations: translations
                    });

                    return translations;
                })
                .exec(callback);

        },

    })
});