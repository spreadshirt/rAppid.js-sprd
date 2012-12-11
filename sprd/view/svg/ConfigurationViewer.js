define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', "sprd/view/svg/TextConfigurationRenderer", "sprd/view/svg/DesignConfigurationRenderer"],
    function (SvgElement, TextConfiguration, DesignConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer) {

        return SvgElement.inherit({

            defaults: {
                tagName: 'g',
                componentClass: 'configuration-viewer',
                configuration: null,

                scaleX: "{configuration.scale.x}",
                scaleY: "{configuration.scale.y}",

                translateX: "{configuration.offset.x}",
                translateY: "{configuration.offset.y}"
            },

            $classAttributes: ["configuration", "product", "printAreaViewer"],

            _initializeRenderer: function () {


                var rendererFactory,
                    configuration = this.$.configuration;

                if (configuration instanceof DesignConfiguration) {
                    rendererFactory = DesignConfigurationRenderer;
                } else if (configuration instanceof TextConfiguration) {
                    rendererFactory = TextConfigurationRenderer;
                }

                if (rendererFactory) {
                    this.$asset = this.createComponent(rendererFactory, {
                        configuration: configuration
                    });

                    this.addChild(this.$asset);
                } else {
                    this.log("Cannot create renderer for configuration", "error");
                }



                this.callBase();
            }
        });
    });