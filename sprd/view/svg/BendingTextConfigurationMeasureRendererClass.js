define(['sprd/view/svg/TextConfigurationMeasureRendererClass'], function (TextConfigurationMeasureRendererClass) {

    return TextConfigurationMeasureRendererClass.inherit("sprd.view.svg.BendingTextConfigurationMeasureRendererClass", {
        defaults: {
            configuration: null,
            width: "{configuration.width()}",
            height: "{configuration.height()}",
            preserveAspectRatio: "none",
            bbox: null,
            loadedFonts: null
        },

        initViewBox: function () {
            var textBbox = this.$.text.$el.getBBox();
            this.set('bbox', textBbox);
            this.setViewBox(textBbox.x, textBbox.y, textBbox.width, textBbox.height);
        }
    })
});
