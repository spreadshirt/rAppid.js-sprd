define(['js/core/Component', 'underscore'], function (Component, _) {

    var Config = {
        EU: {
            supportedLocales: ["de_DE", "de_AT", "de_CH" , "dk_DK", "en_GB", "en_IE", "es_ES", "en_EU", "fi_FI", "fr_BE", "fr_FR", "fr_CH", "it_IT", "nl_BE", "nl_NL", "no_NO", "pl_PL", "se_SE"],
            fallbackLocale: "en_EU"
        },
        NA: {
            supportedLocales: ["us_US", "us_CA", "fr_CA", "us_AU"],
            fallbackLocale: "us_US"
        }
    };

    return Component.inherit('sprd.manager.LocaleManager', {

        defaults: {
            platform: 'EU'
        },

        getConfig: function() {
            return Config[(this.$.platform || "").toUpperCase()] || Config["EU"];
        },

        getLocale: function(locale) {
            var config = this.getConfig();

            locale = (locale || config.fallbackLocale);

            if (_.include(config.supportedLocales, locale)) {
                return locale;
            }

            return this.findFallbackLocale(locale);
        },

        findFallbackLocale: function(locale) {
            var config = this.getConfig();

            var split = locale.split("_");

            var language = split[0];
            var country = split[1];

            if ((this.$.platform || "").toUpperCase() === "NA" && language === "en") {
                language = "us";
            }

            return _.find(config.supportedLocales, function(locale) {
                // find by language
                return locale.split("_")[0] === language;
            }) || _.find(config.supportedLocales, function(locale) {
                // find by language
                return locale.split("_")[1] === country;
            }) || config.fallbackLocale;

        }
    });
});