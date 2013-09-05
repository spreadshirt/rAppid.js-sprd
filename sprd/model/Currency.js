define(["sprd/data/SprdModel", "underscore"], function (Model, _) {

    var dotCurrencyCodes = ['USD', 'GBP'];

    return Model.inherit('sprd.model.Currency', {

        defaults: {
            decimalCount: 2
        },

        formatPrice: function (price, type) {
            if (!price) {
                return null;
            }
            type = type || "vatIncluded";
            return this.formatValue(price.get(type));
        }.on("change"),

        formatValue: function (val) {

            var pow = Math.pow(10, this.$.decimalCount);
            val = Math.round(val * pow) / pow;

            val = new String(val).split(".");
            var len = val.length;
            if (len === 1) {
                val.push("00");
            } else if (val[1].length < this.$.decimalCount) {
                val[1] += "0";
            } else if (val[1].length > this.$.decimalCount) {
                val[1] = val[1].substr(0, 2);
            }

            if (this.$.pattern) {
                var isDotCurrency = _.include(dotCurrencyCodes, this.$.isoCode);

                var currencySeparator = isDotCurrency ? "." : ",";


                val = this.$.pattern.replace('%', val.join(currencySeparator)).replace('$', this.$.symbol);

                if (isDotCurrency) {
                    val = val.replace(" ", "");
                }
            }
            return val;

        }.on("change")
    });

});