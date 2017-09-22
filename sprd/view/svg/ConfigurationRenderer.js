define(['js/svg/SvgElement'], function(SvgElement) {

    return SvgElement.inherit("sprd.view.svg.ConfigurationRenderer", {
        defaults: {
            x: 0,
            y: 0,
            width: "{configuration.size().width}",
            height: "{configuration.size().height}",
            focused: "{configurationViewer.focused}",
            componentClass: "configuration-renderer",

            imageService: null,
            loading: "{configuration.loading}"
        },

        $classAttributes: ["configuration","productViewer", "configurationViewer","textArea","showSelection","focused", "imageService"],

        _focus: function() {
            // hook: invoked after configuration viewer move, scale, rotate finished
        },

        loaderSize: function() {
            return this.$.height * 0.5;
        }.onChange("height"),

        loaderPos: function() {
            var s = this.loaderSize() * 0.5;
            return {
                x: this.$.width * 0.5 - s,
                y: this.$.height * 0.5 - s
            }
        }.onChange("width", "height")
    })
});