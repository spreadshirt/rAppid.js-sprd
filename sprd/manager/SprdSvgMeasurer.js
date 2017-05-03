define(["text/composer/SvgMeasurer", "xaml!text/ui/SvgTextAreaBase"], function (SvgMeasurer, SvgTextArea) {

    return SvgMeasurer.inherit("sprd.manager.SprdSvgMeasurer", {

        ctor: function (svg, imageService) {
            this.callBase(svg);
            this.$imageService = imageService;
        },

        getFontInformation: function (font) {
            return {
                url: this.$imageService.fontUrl(font),
                name: font.getUniqueFontName()
            };
        },

        measureComposedTextFlow: function (compositionResult) {

            if (!this.svgTextArea) {

                this.svgTextArea = this.svg.createComponent(SvgTextArea, {
                    editable: false,
                    selectable: false,
                    showSelection: false
                });

                this.svg.addChild(this.svgTextArea);
            }

            var layout = compositionResult.layout;

            if (layout.autoGrow) {
                layout.width = compositionResult.composed.getWidth();
                layout.height = compositionResult.composed.getHeight();
            }

            this.svgTextArea.set({
                composedTextFlow: compositionResult,
                height: layout.height,
                width: layout.width
            });

            var textEl = this.svgTextArea.$.text.$el;
            var bbox = textEl.getBBox();

            var width = bbox.width;
            if (layout.autoGrow) {
                width = bbox.width - bbox.x;
            }

            // Chrome returns 0 for y, which is correct
            // Safari returns some value for y
            // when adding this value to the height, the height is correct in safari
            // same for FF
            return {
                x: bbox.x,
                y: 0,
                width: width,
                height: bbox.height + (bbox.y)
            };

        }
    });
});