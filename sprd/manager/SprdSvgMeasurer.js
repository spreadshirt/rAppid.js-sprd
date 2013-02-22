define(["text/composer/SvgMeasurer"], function(SvgMeasurer) {

    return SvgMeasurer.inherit("sprd.manager.SprdSvgMeasurer", {

        ctor: function(svg, imageService) {
            this.callBase(svg);
            this.$imageService = imageService;
        },

        getFontInformation: function(font) {
            return {
                url: this.$imageService.fontUrl(font),
                name: font.getUniqueFontName()
            };
        }
    });
});