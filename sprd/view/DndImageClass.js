define(["js/ui/View"], function (View) {

    var DROP_HOVERED = {
        YES: "YES",
        INVALID: "INVALID",
        NO: "NO"
    };

    return View.inherit({

        defaults: {
            componentClass: 'dnd-image',

            configurationViewer: null,
            svgContainer: null,
            design: null,
            hoverState: DROP_HOVERED.NO,
            initializeInvisibleChildren: true
        },

        $classAttributes: ["design", "svgElement", "svgContainer"],

        _renderConfigurationViewer: function(configViewer) {
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
        },
        _renderHoverState: function(hovered) {
            this.removeClass('ok invalid');

            var stage = this.$stage;
            if (stage) {
                stage.removeClass("dnd-ok dnd-invalid");
            }

            switch (hovered) {
                case DROP_HOVERED.YES :
                    this.addClass('ok');
                    stage && stage.addClass("dnd-ok");
                    break;
                case DROP_HOVERED.INVALID:
                    this.addClass('invalid');
                    stage && stage.addClass("dnd-invalid");
                    break;
            }

        }
    }, {
        DROP_HOVERED: DROP_HOVERED
    });

});