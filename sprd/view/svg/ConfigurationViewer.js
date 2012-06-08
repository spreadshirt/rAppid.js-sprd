define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', 'sprd/view/svg/TextConfigurationRenderer', 'sprd/view/svg/DesignConfigurationRenderer', 'Raphael'],
    function (SvgElement, TextConfiguration, DesignConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer, Raphael) {

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


            },

            render: function() {

            }


//            _transform: function (svg) {
//
//                svg = svg || this.$svg;
//
//                if (!this.$configuration) {
//                    return;
//                }
//
//                var matrix = Raphael.matrix();
//                matrix.translate(this.$configuration.get('offset.x'), this.$configuration.get('offset.y'));
//                matrix.rotate(this.$configuration.get('rotation'), 0, 0);
//
//                if (this.$printAreaViewer) {
//                    this.$printAreaViewer.transform(matrix);
//                }
//
//                svg.transform(matrix.toTransformString());
//
//            }
        });
    });