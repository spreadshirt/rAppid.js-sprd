define(['sprd/view/svg/ConfigurationRenderer', 'sprd/util/UnitUtil'], function(ConfigurationRenderer, UnitUtil) {

    return ConfigurationRenderer.inherit("sprd/view/svg/TextConfigurationRenderer", {

        defaults: {
            tagName: "text"
        },

        $classAttributes: ["configuration"],

        render:function() {
            this.callBase();
        },

        _renderText: function(text) {
            this.$el.innerText = text;
        }

//        ctor: function() {
//            this.callBase();
//
//            this.bind('configuration', 'change:text', function() {
//                this.$configurationViewer._transform(this.render(this.$paper));
//            }, this)
//        },

//        _render: function(paper) {
//            if (!paper) {
//                return;
//            }
//
//            this.callBase();
//
//            if (!this.$.configuration) {
//                return null;
//            }
//
//            var fontSizeInMm = UnitUtil.pointToMillimeter(this.get('configuration.fontSize'));
//            var text = this.get('configuration.text');
//            var words = text.split(' ');
//            var font = paper.getFont(this.get('configuration.font'));
//
//            var svg = paper.print(0, fontSizeInMm/2, text, font, fontSizeInMm);
//
//            var boxWidth = 300;
//            if (svg.getBBox().width > boxWidth) {
//                svg.hide();
//
//                text = words[0] || "";
//                for (var i = 1; i < words.length; i++) {
//
//                    var word = words[i];
//                    var textWithWord = text + " " + word;
//
//                    svg = paper.print(0, fontSizeInMm / 2, textWithWord, font, fontSizeInMm);
//                    svg.hide();
//
//                    if (svg.getBBox().width > boxWidth) {
//                        text = text + "\n" + word;
//                    } else {
//                        text = text + " " + word;
//                    }
//                }
//
//                svg = paper.print(0, fontSizeInMm / 2, text, font, fontSizeInMm);
//            }
//
//
//            return svg;
//        }
    })
});