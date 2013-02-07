define(['sprd/view/svg/ConfigurationRenderer'], function(ConfigurationRenderer) {

    return ConfigurationRenderer.inherit("sprd.view.svg.TextConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            componentClass: "text-configuration"
        },

        ctor: function() {
            this.callBase();
        }
    });
});