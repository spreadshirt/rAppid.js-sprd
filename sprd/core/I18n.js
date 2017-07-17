define(["js/core/I18n"], function(I18n) {

    return I18n.inherit({
        t: function(num, key) {

            if (_.isNumber(num) && num > 1) {

                var args = Array.prototype.slice.call(arguments);
                key = args.shift();

                if (key > 5) {
                    key = args.shift();
                    return I18n.prototype.t.apply(this, [key + "_large_plural"].concat(args)) || I18n.prototype.t.apply(this, [key + "_plural"].concat(args))
                }

                key = args.shift();
                return I18n.prototype.t.apply(this, [key + "_plural"].concat(args));

            }

            return this.callBase();

        }.onChange("translations")
    })
});