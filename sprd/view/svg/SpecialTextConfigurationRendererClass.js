define(['sprd/view/svg/ConfigurationRenderer'], function (ConfigurationRenderer) {

    return ConfigurationRenderer.inherit("sprd.view.svg.SpecialTextConfigurationRendererClass", {

        defaults: {
            _href: "{configuration.previewImageUrl()}"
        },

        $classAttributes: ["x", "y", "width", "height"]
    });
});