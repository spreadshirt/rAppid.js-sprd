define(["js/ui/View", "js/core/I18n"], function(View, I18n) {

    var companyData = {
        EU: {
            name: "sprd.net AG",
            street: "Gießerstraße 27",
            city: "D 04229 Leipzig",
            country: "Deutschland",
            board: "Philip Rooke (CEO), Tobias Schaugg (CFO)",
            boardDirector: "Łukasz Gadowski",
            vatId: "DE 813871494",
            tradeRegister: "Amtsgericht Leipzig, HRB 22478",
            email: "info@spreadshirt.de",
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
        }
    };

    return View.inherit("sprd.view.ImprintClass", {

        defaults: {
            platform: "EU",

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

        _commitPlatform: function(platform) {
            this.set(companyData[platform]);
        },

        isEU: function() {
            return this.$.platform === "EU";
        }.onChange("platform")

    });
});