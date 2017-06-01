define(['js/svg/SvgElement'], function(SvgElement) {

    var counter = 0;

    return SvgElement.inherit("sprd.view.svg.Image", {
        defaults: {
            tagName: "image"
        },

        $events: ["on:imageLoaded"],

        _renderHref: function(href) {
            this.callBase();

            if (href) {
                var image = new Image(),
                    self  = this;

                image.onload = function() {
                    if (self.$.href == href) {
                        self.trigger("on:imageLoaded");
                    }
                };

                image.src = href;
            }
        }
    })
});