define(['js/core/Component', 'underscore'], function (Component, _) {

    var Languages = {
        EU: ["de", "dk", "en", "es", "fi", "fr", "it", "nl", "no", "pl", "se"],
        NA: ["fr", "us"]
    };

    return Component.inherit('sprd.util.LocaleService', {

        defaults: {
            fallbackLanguage: 'en',
            fallbackCountry: 'EU',
            supportedLanguages: null,
            supportedCountries: null,
            platform: 'EU'
        },

        $languageMap: {
            de: 'de',
            fr: 'fr',
            'co.uk': 'en',
            be: 'nl',
            dk: 'dk',
            es: 'es',
            ie: 'en',
            it: 'it',
            nl: 'nl',
            no: 'no',
            pl: 'pl',
            fi: 'fi',
            se: 'se',
            at: 'de',

            net: null,
            com: null
        },

        $countryMap: {
            de: 'DE',
            fr: 'FR',
            'co.uk': 'GB',
            be: 'BE',
            dk: 'DK',
            es: 'ES',
            ie: 'IE',
            it: 'IT',
            nl: 'NL',
            no: 'NO',
            pl: 'PL',
            fi: 'FI',
            se: 'SE',
            at: 'AT',

            net: "EU",
            com: "US"
        },

        _commitPlatform: function(platform) {
            this.set("supportedLanguages", Languages[platform]);
        },

        getLanguage: function (language) {
            var supportedLanguages = this.$.supportedLanguages;

            if (supportedLanguages && _.indexOf(supportedLanguages, language)) {
                return language;
            }

            var browserLanguage = (navigator.language || navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage).split("-")[0];
            return this.determinateLanguage(this.getHost(), browserLanguage, supportedLanguages, this.$.fallbackLanguage);
        },

        getCountry: function () {
            return this.determinateCountry(this.getHost(), this.$.supportedCountries, this.$.fallbackCountry);
        },

        getHost: function () {
            return this.runsInBrowser() ? this.$stage.$window.location.host : null;
        },

        getLocale: function () {
            return this.getLanguage() + '_' + this.getCountry();
        },

        determinateLanguage: function (hostname, browserLanguage, supportedLanguages, fallbackLanguage) {
            fallbackLanguage = fallbackLanguage || 'en';

            if (supportedLanguages && !(supportedLanguages instanceof Array)) {
                supportedLanguages = (supportedLanguages || "").split(";");
            }

            var language;

            if (hostname) {
                // determinate by domain
                var domain = /\.v?([a-z]{2,4})$/.exec(hostname);
                if (domain) {
                    language = this.$languageMap[domain[1]];
                }

                language = language || browserLanguage;

            }

            language = language || browserLanguage;

            for (var key in this.$languageMap) {
                if (this.$languageMap.hasOwnProperty(key) &&
                    (key && key === this.$languageMap[key] && (!supportedLanguages || supportedLanguages[key]))) {
                        return language;
                }
            }

            return fallbackLanguage;
        },

        determinateCountry: function (hostname, supportedCountries, fallbackCountry) {
            fallbackCountry = fallbackCountry || 'EU';

            if (supportedCountries && !(supportedCountries instanceof Array)) {
                supportedCountries = (supportedCountries || "").split(";");
            }

            var country;

            if (hostname) {
                // determinate by domain
                var domain = /\.v?([a-z]{2,4})$/.exec(hostname);
                if (domain) {
                    country = this.$countryMap[domain[1]];
                }
            }

            for (var key in this.$countryMap) {
                if (this.$countryMap.hasOwnProperty(key) &&
                    (key && key === this.$countryMap[key] && (!supportedCountries || supportedCountries[key]))) {
                        return country;
                }
            }

            return fallbackCountry;
        }

    }, {
        Languages: Languages
    });
});