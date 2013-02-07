define(['sprd/view/svg/ConfigurationRenderer', 'sprd/util/UnitUtil'], function(ConfigurationRenderer, UnitUtil) {

    return ConfigurationRenderer.inherit("sprd.view.svg.TextConfigurationRendererClass", {

        defaults: {
            tagName: "g",
            componentClass: "text-configuration"
        },

        ctor: function() {
            this.callBase();
        }
    })
});