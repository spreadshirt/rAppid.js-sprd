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

        $domainLanguageMap: {
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

        domainCountryMap: {
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

        supportsLanguage: function(language) {
            var supportedLanguages = this.$.supportedLanguages;
            return supportedLanguages && _.indexOf(supportedLanguages, language) !== -1;
        },

        getLanguage: function (language) {

            var navigator = this.$stage.$window.navigator || {};

            if (language && this.supportsLanguage(language)) {
                return language;
            }

            var browserLanguage = (navigator.language || navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || "").split("-")[0];
            return this.determinateLanguage(this.getHost(), browserLanguage, this.$.supportedLanguages, this.$.fallbackLanguage);
        },

        getCountry: function () {
            return this.determinateCountry(this.getHost(), this.$.supportedCountries, this.$.fallbackCountry);
        },

        getHost: function () {
            return this.runsInBrowser() ? this.$stage.$window.location.hostname : null;
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
                    language = this.$domainLanguageMap[domain[1]];
                }

            }

            language = language || browserLanguage;

            if (this.supportsLanguage(language)) {
                return language;
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
                    country = this.domainCountryMap[domain[1]];
                }
            }

            for (var key in this.domainCountryMap) {
                if (this.domainCountryMap.hasOwnProperty(key) &&
                    (key && key === this.domainCountryMap[key] && (!supportedCountries || supportedCountries[key]))) {
                        return country;
                }
            }

            return fallbackCountry;
        }

    }, {
        Languages: Languages
    });
});