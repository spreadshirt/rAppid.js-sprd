define(["text/composer/SvgMeasurer", "xaml!text/ui/SvgTextArea"], function (SvgMeasurer, SvgTextArea) {

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

            this.svgTextArea.set({
                composedTextFlow: compositionResult,
                height: layout.height,
                width: layout.width
            });

            var textEl = this.svgTextArea.$.text.$el;
            var bbox = textEl.getBBox();

            return {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height
            };

        }
    });
});