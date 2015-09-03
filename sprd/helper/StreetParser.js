(function (exports, define) {

    var matcher = [
        {
            regex: /^(?:(?:(\D+),\s*)?(?:(?:(\D+str\.))|(?:(\D+?(?:stra0e)?(?:n.\d+)?)[,.\s]))\s?(\d+\.?\s?\/?[a-zA-Z]*(?:(?:\s\w\d+)|(?:\d+\s(?:st\.)?\s?tv\.?)|(?:\s?[-/\s]\s?\d+[a-z°ºª]*\s?\w?))*)(?:\s*[,-]\s*(.*))?)$/i,
            parts: ["ext", "street", "street", "nr", "ext"]
        },
        {
            regex: /^(\D+,\s?)?(\d+\s?\/?[a-z]{0,2}(?:\s?-\s?\d+)?)\s*?[,\s.]\s?(?:((?:\d+th\s)?\D+?(?:\s.*?)?)[,]?)$/i,
            parts: ["ext", "nr", "street"]
        },
        {
            regex: /^(\D+)(\d+)$/i,
            parts: ["street", "nr"]
        }
    ];

    exports.parseStreet = function (street) {

        if (/packstation/i.exec(street)) {
            return null;
        }

        for (var i = 0; i < matcher.length; i++) {
            var match = matcher[i].regex.exec(street);
            if (match) {

                var ret = {};

                for (var j = 0; j < matcher[i].parts.length; j++) {
                    ret[matcher[i].parts[j]] = match[j + 1] || ret[matcher[i].parts[j]];

                }

                return ret;
            }

        }

        return null;

    };

    define && define({parseStreet: exports.parseStreet});
}(typeof(exports) === "undefined" ? this : exports, define));