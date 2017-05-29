define(['js/svg/Svg'], function(Svg) {

    return Svg.inherit("sprd.view.svg.BendingTextConfigurationUploadRendererClass", {

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


                if (!w) {
                    return 0;
                } else {
                    return Math.ceil(width * h / w);
                }
            }
        }.onChange('viewBox'),

        getElement: function(options) {
            var textBbox = this.$.text.$el.getBBox(),
                config = this.$.configuration,
                svgNamespace = 'http://www.w3.org/2000/svg',
                xlinkNS = 'http://www.w3.org/1999/xlink',
                elem = this.$el,
                size = this.get('configuration._size');

            if (!elem) {
                return null;
            }

            elem.setAttribute("xmlns", svgNamespace);
            elem.setAttribute("xmlns:xlink", xlinkNS);

            if (textBbox.width === 0 && textBbox.height === 0 && config) {
                this.setViewBox(textBbox.x, textBbox.y, config.widthInMM(1), config.heightInMM(1));
            } else {
                this.setViewBox(textBbox.x, textBbox.y, textBbox.width, textBbox.height);
            }

            return elem;
        },

        getElementAsString: function(options) {
            var elem = this.getElement(options),
                docString = '<!DOCTYPE svg [ <!ENTITY nbsp " &#160;">] >',
                svgContent = elem.outerHTML;

            svgContent = svgContent.replace(/\b[a-z0-9]+:href/ig, "xlink:href");
            return docString + svgContent;
        }
    });
});