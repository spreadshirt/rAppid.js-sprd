define(["js/ui/View"], function (View) {

    var ratios = {
        2: [75, 25],
        3: [60, 30, 10]
    };

    var lengthCache = {};

    return View.inherit("sprd.view.AppearanceColorClass", {

        defaults: {
            appearance: null,
            componentClass: "appearance-color appearance-{appearance.id}"
        },

        colorWidth: function (index) {
            var length = this.get("appearance.colors.length");

            var cacheKey = "" + length+"_"+index;
            if (lengthCache.hasOwnProperty(cacheKey)) {
                return lengthCache[cacheKey];
            }

            var ret = 0;
            if (length) {

                if (ratios.hasOwnProperty(length)) {
                    ret = ratios[length][index];
                } else {
                    ret = 100 / length;
                }

            }

            lengthCache[cacheKey] = ret;

            return ret;

        }.onChange("appearance")

    });

});
