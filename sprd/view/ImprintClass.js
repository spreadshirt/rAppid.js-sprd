define(["js/ui/View", "js/core/I18n", "underscore"], function(View, I18n, _) {

    var companyData = {
        EU: {
            name: "sprd.net AG",
            street: "Gießerstraße 27",
            city: "04229 Leipzig",
            country: "Deutschland",
            board: "Philip Rooke (CEO), Tobias Schaugg (CFO)",
            boardDirector: "Łukasz Gadowski",
            vatId: "DE 813871494",
            tradeRegister: "Amtsgericht Leipzig, HRB 22478",
            email: "info@spreadshirt.net",
            website: "http://www.spreadshirt.de",
            phone: "+49 (0)341 594 00 5900",
            fax: "+49 (0) 341 594 00 5499",
            dmca: ''
        },
        NA: {
            name: "Spreadshirt, Inc.",
            street: "1572 Roseytown Road",
            city: "Greensburg, PA 15601-4140",
            country: "USA",
            board: "",
            boardDirector: "",
            vatId: "",
            tradeRegister: "",
            email: "info@spreadshirt.com",
            website: "http://www.spreadshirt.com",
            phone: "1-800-381-0815",
            fax: "1-877-202-0251",
            dmca: "DMCA Notice" // TODO: I18n.
        },

        de: {
            email: "info@spreadshirt.de"
        },

        fr: {
            phone: "+33 (0) 1 82 88 88 22",
            country: "Allemagne"
        },

        en: {
            phone: "+44 (0) 20 3137 2587",
            country: "Germany"
        }
    };

    return View.inherit("sprd.view.ImprintClass", {

        defaults: {
            platform: "EU",
            locale: null,

            componentClass: "imprint",

            name: null,
            defaults: null,
            street: null,
            city: null,
            country: null,
            board: null,
            boardDirector: null,
            vatId: null,
            tradeRegister: null,
            email: null,
            website: null,
            phone: null,
            fax: null
        },

        inject: {
            i18n: I18n
        },

        _commitChangedAttributes: function($) {

            if (this._hasSome($, ["platform", "locale"])) {

                var language = (this.$.locale || "").split("_")[0];
                var data = _.extend(companyData[this.$.platform] || {}, companyData[language]);

                // always stay with USA in NA as country
                if (this.$.platform === "NA") {
                    data.country = "USA";
                }

                this.set(data);
            }

        },

        isEU: function() {
            return this.$.platform === "EU";
        }.onChange("platform")

    });
});