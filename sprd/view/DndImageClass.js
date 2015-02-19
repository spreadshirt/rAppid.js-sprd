define(["js/ui/View"], function (View) {

    return View.inherit({

        defaults: {
            componentClass: 'dnd-image',

            configurationViewer: null,
            svgContainer: null,
            design: null,
            initializeInvisibleChildren: true
        },

        $classAttributes: ["design", "svgElement", "svgContainer"],

        _renderConfigurationViewer: function (configViewer) {
            if (this.$.svgContainer) {
                if (this.$currentElement) {
                    this.$.svgContainer.$el.removeChild(this.$currentElement);
                }
                if (configViewer) {
                    var assetContainer = configViewer.$._assetContainer;
                    var clone = assetContainer.$el.cloneNode(true);
                    this.$currentElement = clone;

                    var vMax = Math.max(configViewer.$.configuration.width(), configViewer.$.configuration.height());
                    this.$.svgContainer.$el.setAttribute("viewBox", [0, 0, vMax, vMax].join(" "));
                    this.$.svgContainer.$el.appendChild(clone);
                }
            }
        }
    });

});