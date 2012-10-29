define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', 'sprd/view/svg/TextConfigurationRenderer', 'sprd/view/svg/DesignConfigurationRenderer'],
    function (SvgElement, TextConfiguration, DesignConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer) {

        return SvgElement.inherit({

            defaults: {
                tagName: 'g',
                "class": 'configuration-viewer'
            },

            $classAttributes: ["configuration"],

            ctor: function (attributes) {

                this.callBase();

                var configuration = attributes.configuration;

                if (!configuration) {
                    throw "Configuration for viewer not defined";
                }

                this.$configuration = configuration;

            }
        });
    });