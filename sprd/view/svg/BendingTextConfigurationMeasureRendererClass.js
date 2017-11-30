define(['sprd/view/svg/TextConfigurationMeasureRendererClass'], function (TextConfigurationMeasureRendererClass) {

    return TextConfigurationMeasureRendererClass.inherit("sprd.view.svg.BendingTextConfigurationMeasureRendererClass", {
        defaults: {
            configuration: null,
            width: "{configuration.width(1)}",
            height: "{configuration.height(1)}"
        },

        $classAttributes: ['configuration', 'textArea', 'bbox', 'loadedFonts', 'defaultInnerRect', 'text', 'textPath', 'path'],

        initViewBox: function () {
            var textBbox = this.$.text.$el.getBBox();
            this.set('bbox', textBbox);
            this.setViewBox(textBbox.x, textBbox.y, textBbox.width, textBbox.height);
        }
    })
});
