define(['sprd/view/svg/ConfigurationRenderer', 'sprd/util/UnitUtil'], function(ConfigurationRenderer, UnitUtil) {

    return ConfigurationRenderer.inherit("sprd.view.svg.TextConfigurationRenderer", {

        defaults: {
            tagName: "text"
        },

        render:function() {
            this.callBase();
        }
    })
});