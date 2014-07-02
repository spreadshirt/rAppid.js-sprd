define(['sprd/view/svg/ConfigurationRenderer'], function (ConfigurationRenderer) {

    return ConfigurationRenderer.inherit("sprd.view.svg.SpecialTextConfigurationRenderer", {

        defaults: {
            tagName: "image",
            href: "{configuration.previewImageUrl}"
        }

    });
});