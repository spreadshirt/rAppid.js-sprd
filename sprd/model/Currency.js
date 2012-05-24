define(["sprd/data/SprdModel"], function (Model) {
    return Model.inherit('sprd.model.Currency', {

        $cacheInRootContext: true,

        formatPrice: function (price, type) {
            if(!price) {
                return null;
            }
            type = type || "vatIncluded";
            return this.formatValue(price[type]);
        },
        formatValue: function(val){
            val = new String(val).split(".");
            var len = val.length;
            if (len === 1) {
                val.push("00");
            } else if (val[1].length < this.$.decimalCount) {
                val[1] += "0";
            } else if(val[1].length > this.$.decimalCount) {
                val[1] = val[1].substr(0,2);
            }
            if (this.$.pattern) {
                return this.$.pattern.replace('%', val.join(",")).replace('$', this.$.symbol).replace('.', ',');
            } else {
                return val;
            }
        }
    });

});