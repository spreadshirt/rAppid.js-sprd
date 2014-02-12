define(["sprd/manager/DesignProductInitializer", "sprd/manager/TextConfigurationManager", "text/composer/Composer", "text/operation/ApplyStyleToElementOperation", "sprd/type/Style", "text/composer/Measurer", "js/svg/Svg", "sprd/manager/SprdSvgMeasurer", "sprd/data/ImageService"],
    function (DesignProductInitializer, TextConfigurationManager, Composer, ApplyStyleToElementOperation, Style, Measurer, Svg, SprdSvgMeasurer, ImageService) {


    var APPLY_STYLE_TO_ELEMENT_OPERATION = "ApplyStyleToElementOperation",
        COMPOSER = "composer",
        STYLE = "Style";

    return DesignProductInitializer.inherit("sprd.manager.ProductInitializer", {

        inject: {
            imageService: ImageService
        },

        _addFactories: function(injection) {

            this.callBase();

            var measurer;

            try {
                measurer = injection.getInstance(Measurer)
            } catch (e) {
                // no measure available, create a new one
                var svg = this.createComponent(Svg, {
                    "class": "svg-measurer",
                    "style": "visibility: hidden"
                });

                // because ProductInitializer is not rendered, we need to manually render
                // the svg for measuring

                measurer = new SprdSvgMeasurer(svg, injection.getInstance(ImageService));
                injection.addInstance(measurer);

                var el = svg.render(),
                    body = document.body || document.getElementsByTagName("body")[0];

                body.appendChild(el);
            }

            var singletonInstanceCache = injection.$singletonInstanceCache;

            if (!singletonInstanceCache.hasOwnProperty(COMPOSER)) {
                injection.addInstance(COMPOSER, new Composer(measurer));
            }

            if (!singletonInstanceCache.hasOwnProperty(APPLY_STYLE_TO_ELEMENT_OPERATION)) {
                injection.addInstance(APPLY_STYLE_TO_ELEMENT_OPERATION, ApplyStyleToElementOperation);
            }

            if (!singletonInstanceCache.hasOwnProperty(STYLE)) {
                injection.addInstance(STYLE, Style);
            }

            injection.addFactory({
                factory: TextConfigurationManager,
                singleton: true
            });

        }

    });

});