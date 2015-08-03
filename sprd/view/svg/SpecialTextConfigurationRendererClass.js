define(['sprd/view/svg/ConfigurationRenderer'], function (ConfigurationRenderer) {

    return ConfigurationRenderer.inherit("sprd.view.svg.SpecialTextConfigurationRendererClass", {

        defaults: {
            _href: "{configuration.previewImageUrl()}",
            loading: "{configuration.loading}"
        },

        $classAttributes: ["x", "y", "width", "height"],

        loaderSize: function () {
            return this.$.height * 0.5;
        }.onChange("height"),

        loaderPos: function () {
            var s = this.loaderSize() * 0.5;
            return {
                x: this.$.width * 0.5 - s,
                y: this.$.height * 0.5 - s
            }
        }.onChange("width", "height")

    });
});