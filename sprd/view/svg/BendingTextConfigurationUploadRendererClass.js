define(['js/svg/Svg'], function(Svg) {

    return Svg.inherit("sprd.view.svg.BendingTextConfigurationUploadRendererClass", {

        defaults: {
            configuration: null,
            width: "{width()}mm"
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

        getText: function() {
            var config = this.$.configuration;
            if (config) {
                var text = config.$.text.replace(/\n/g, " ");
                return text.trim();
            }
        },

        $classAttributes: ['textPath', 'path', 'configuration', 'x', 'y', 'text'],

        widthInMM: function() {
            var config = this.$.configuration;
            return config ? Math.round(config.widthInMM()) : 0;
        }.on('configuration.widthInMM()'),

        getElement: function() {
            var textBbox = this.$.text.$el.getBBox(),
                svgNamespace = 'http://www.w3.org/2000/svg',
                xlinkNS = 'http://www.w3.org/1999/xlink',
                elem = this.$el;

            if (!elem) {
                return null;
            }

            elem.setAttribute("xmlns", svgNamespace);
            elem.setAttribute("xmlns:xlink", xlinkNS);

            var vbWidth = Math.max(textBbox.width + (textBbox.x || 0), textBbox.width),
                vbHeight = Math.max(textBbox.height + (textBbox.y || 0), textBbox.height);

            this.setViewBox(0, 0, vbWidth, vbHeight);
            return elem;
        },

        getElementAsString: function() {
            var elem = this.getElement(),
                docString = '<!DOCTYPE svg [ <!ENTITY nbsp " &#160;">] >',
                svgContent = elem.outerHTML;

            svgContent = svgContent.replace(/\b[a-z0-9]+:href/ig, "xlink:href");
            return docString + svgContent;
        }
    });
});
