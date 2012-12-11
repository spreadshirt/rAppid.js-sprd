define(['js/svg/SvgElement'], function(SvgElement) {

    return SvgElement.inherit("sprd.view.svg.ConfigurationRenderer", {
        defaults: {
            x: 0,
            y: 0,
            width: "{configuration.size().width}",
            height: "{configuration.size().height}"
        },

        $classAttributes: ["configuration"]
    })
});