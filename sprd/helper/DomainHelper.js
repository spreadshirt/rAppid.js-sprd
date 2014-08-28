define(["underscore"], function(_) {

    var domainMap = {
        EU: {
            de_DE: "de",
            de_CH: "ch",
            de_AT: "at",
            fr_CH: "ch/fr",
            fr_FR: "fr",
            se_SE: "se",
            dk_DK: "dk",
            fi_FI: "fi",
            nl_NL: "nl",
            pl_PL: "pl",
            es_ES: "es",
            it_CH: "ch/it",
            it_IT: "it",
            no_NO: "no",
            be_BE: "be",
            en_EU: "net",
            en_IE: "ie",
            en_GB: "co.uk"
        },
        NA: {
            fr_CA: "ca/fr",
            en_CA: "ca",
            us_US: "com"
        }
    };

    return {

        domain: function(platform, locale) {
            return this.domainForLocale(platform, locale) ||
                this.domainForLanguage(platform, locale.split("_")[0]) || this.domainForLanguage(platform, "en");
        },

        domainForLocale: function(platform, locale) {

            var map = domainMap[platform];

            if (!map) {
                return null;
            }

            return map[locale];
        },

        domainForLanguage: function(platform, language) {
            return this._domainForPart(platform, 0, language);
        },

        domainForCountry: function (platform, country) {
            return this._domainForPart(platform, 1, country);
        },

        _domainForPart: function(platform, position, value) {

            var map = domainMap[platform];

            if (!map) {
                return null;
            }

            for (var locale in map) {
                if (map.hasOwnProperty(locale) && locale.split("_")[position] === value) {
                    return map[locale];
                }
            }

            return null;
        }

    }
});