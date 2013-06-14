define(["js/ui/View"], function(View) {

    var ratios = {
        2: [75, 25],
        3: [60, 30, 10]
    };

    return View.inherit("sprd.view.AppearanceColorClass", {

        defaults: {
            appearance: null,
            componentClass: "appearance-color"
        },

        colorWidth: function(index) {
            var length = this.get("appearance.colors.length");

            if (length) {

                if (ratios.hasOwnProperty(length)) {
                    return ratios[length][index];
                }

                return 100 / length;
            }

            return 0;

        }.on("appearance.colors.length")

    });

});
