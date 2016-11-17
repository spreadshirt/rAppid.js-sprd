define(["js/ui/View", "js/core/Bus"], function(View, Bus) {

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

        inject: {
            bus: Bus
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

            var stage = this.$stage,
                bus = this.$.bus;
            if (stage) {
                stage.removeClass("dnd-ok dnd-invalid");
            }

            switch (hovered) {
                case DROP_HOVERED.YES :
                    this.addClass('ok');
                    stage && stage.addClass("dnd-ok");
                    bus.trigger("errorMessage", null);
                    break;
                case DROP_HOVERED.INVALID:
                    this.addClass('invalid');
                    stage && stage.addClass("dnd-invalid");
                    bus.trigger("errorMessage", {
                        key: "invalidView",
                        value: "error.invalidView"
                    });
                    break;
                case DROP_HOVERED.NO:
                    setTimeout(function() {
                        bus.trigger("errorMessage", null);
                    }, 5000);
                    break;
            }

        },
        isInvalid: function() {
            return this.$.hoverState == DROP_HOVERED.INVALID;
        }.onChange("hoverState")
    }, {
        DROP_HOVERED: DROP_HOVERED
    });

});