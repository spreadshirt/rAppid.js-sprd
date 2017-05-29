define(['js/svg/Svg', 'js/core/Bus', 'underscore'], function(Svg, Bus, _) {

    return Svg.inherit("sprd.view.svg.BendingTextConfigurationRendererClass", {

        defaults: {
            configuration: null,
            x: 0,
            y: 0,
            width: "{width()}",
            height: "{height()}"
        },

        ctor: function() {
            this.callBase();
            var config = this.$.configuration;
            config.uploadRenderer = this;
        },

        _initializationComplete: function() {
            this.removeChild(this.$.hidden);
            this.removeChild(this.$.defs);
        },

        $classAttributes: ['textPath', 'path', 'configuration', 'x', 'y', 'text'],

        width: function() {
            var config = this.$.configuration;
            if (config) {
                return Math.round(config.widthInMM() + 50)
            }
        }.on('configuration.widthInMM()'),

        height: function() {
            var config = this.$.configuration;
            if (config) {
                var width = this.width(),
                    h = this.$viewBoxHeight,
                    w = this.$viewBoxWidth;

                return w > 0 ? Math.ceil(width * h / w) : 0;
            }
        }.onChange('viewBox'),

        getElement: function(options) {
            var textBbox = this.$.text.$el.getBBox(),
                svgNamespace = 'http://www.w3.org/2000/svg',
                xlinkNS = 'http://www.w3.org/1999/xlink',
                elem = this.$el,
                size = this.get('configuration._size');

            if (!elem) {
                return null;
            }

            this.setViewBox(textBbox.x, textBbox.y, textBbox.width || size.width, textBbox.height || size.height);
            elem.setAttribute("xmlns", svgNamespace);
            elem.setAttribute("xmlns:xlink", xlinkNS);
            return elem;
        },

        getElementAsString: function(options) {
            var elem = this.getElement(options),
                docString = '<!DOCTYPE svg [ <!ENTITY nbsp " &#160;">] >';
            return docString + elem.outerHTML;
        }
    });
});