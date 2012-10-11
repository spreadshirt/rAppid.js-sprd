define(['js/core/Component'], function (Component) {

    return Component.inherit('sprd.util.LocaleService', {

        defaults: {
            fallbackLanguage: 'en',
            fallbackCountry: 'EU',
            supportedLanguages: null,
            supportedCountries: null
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

        getLanguage: function () {
            var browserLanguage = (navigator.language || navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage).split("-")[0];
            return this.determinateLanguage(this.getHost(), browserLanguage, this.$.supportedLanguages, this.$.fallbackLanguage);
        },

        getCountry: function() {
            return this.determinateCountry(this.getHost(), this.$.supportedCountries, this.$.fallbackCountry);
        },

        getHost: function() {
            return this.runsInBrowser() ? this.$stage.$window.location.host : null;
        },

        getLocale: function() {
            return this.getLanguage() + '_' + this.getCountry();
        },

        determinateLanguage: function (host, browserLanguage, supportedLanguages, fallbackLanguage) {
            fallbackLanguage = fallbackLanguage || 'en';

            if (supportedLanguages && !(supportedLanguages instanceof Array)) {
                supportedLanguages = (supportedLanguages || "").split(";")
            }

            var language;

            if (host) {
                // determinate by domain
                var domain = /\.([a-z]{2,4})$/.exec(host);
                if (domain) {
                    language = this.$languageMap[domain[1]];
                }

                language = language || browserLanguage;

            }

            language = language ||browserLanguage;

            for (var key in this.$languageMap) {
                if (this.$languageMap.hasOwnProperty(key)) {
                    if (key && key === this.$languageMap[key] && (!supportedLanguages || supportedLanguages[key])) {
                        return language;
                    }
                }
            }

            return fallbackLanguage;
        },

        determinateCountry: function (host, supportedCountries, fallbackCountry) {
            fallbackCountry = fallbackCountry || 'EU';

            if (supportedCountries && !(supportedCountries instanceof Array)) {
                supportedCountries = (supportedCountries || "").split(";")
            }

            var country;

            if (host) {
                // determinate by domain
                var domain = /\.([a-z]{2,4})$/.exec(host);
                if (domain) {
                    country = this.$countryMap[domain[1]];
                }
            }

            for (var key in this.$countryMap) {
                if (this.$countryMap.hasOwnProperty(key)) {
                    if (key && key === this.$countryMap[key] && (!supportedCountries || supportedCountries[key])) {
                        return country;
                    }
                }
            }

            return fallbackCountry;
        }

    });
});