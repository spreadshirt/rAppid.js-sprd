define(["js/ui/View", "sprd/data/ImageService"], function (View, ImageService) {

    var ratios = {
        2: [75, 25],
        3: [60, 30, 10]
    };

    var lengthCache = {};

    return View.inherit("sprd.view.AppearanceColorClass", {

        defaults: {
            appearance: null,
            componentClass: "appearance-color appearance-{appearance.id} {whiteClass()}",
            title: "{appearance.name}",
            showTitle: true
        },

        inject: {
            imageService: ImageService
        },

        _renderTitle: function(title) {
            if (this.$.showTitle) {
                this._setAttribute("title", title)
            }
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

        }.onChange("appearance"),

        textureImage: function() {

            var imageService = this.$.imageService,
                appearance = this.$.appearance;

            if (!(imageService && appearance && appearance.$.texture)) {
                return;
            }

            return imageService.appearanceImage(appearance.$.id);

        }.onChange("appearance"),

        whiteClass: function() {
            return /#f{6}/i.test(this.get("appearance.colors[0].color().toString()") || "") ? "white" : "";
        }.onChange("appearance")
    });

});
