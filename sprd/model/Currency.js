define(["sprd/data/SprdModel", "underscore"], function (Model, _) {

    var dotCurrencyCodes = ['USD', 'GBP', 'AUD', 'CAD'];

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
            var afterDecimals = val.length > 1 ? val[1] : "";
            var zerosToAdd = this.$.decimalCount - afterDecimals.length;

            if (zerosToAdd > 0) {
                // add zeros
                for (var i = 0; i < zerosToAdd; i++) {
                    afterDecimals += "0";
                }
            } else if (zerosToAdd < 0) {
                // remove zeros
                afterDecimals = afterDecimals.substr(0, -1 * zerosToAdd);
            }


            if (afterDecimals) {
                if (val.length > 1) {
                    val[1] = afterDecimals;
                } else {
                    val.push(afterDecimals);
                }
            } else if (val.length > 1) {
                val.pop();
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