define(['js/svg/SvgElement'], function(SvgElement) {

    return SvgElement.inherit("sprd.view.svg.ConfigurationRenderer", {
        defaults: {
            x: 0,
            y: 0,
            width: "{configuration.size().width}",
            height: "{configuration.size().height}",
            focused: "{configurationViewer.focused}",
            componentClass: "configuration-renderer",

            imageService: null
        },

        $classAttributes: ["configuration","productViewer", "configurationViewer","textArea","showSelection","focused", "imageService"],

        _focus: function() {
            // hook: invoked after configuration viewer move, scale, rotate finished
        }
    })
});