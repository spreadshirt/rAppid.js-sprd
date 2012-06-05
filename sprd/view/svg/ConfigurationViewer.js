define(['sprd/view/svg/SvgBase', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', 'sprd/view/svg/TextConfigurationRenderer', 'sprd/view/svg/DesignConfigurationRenderer', 'Raphael'],
    function(SvgBase, TextConfiguration, DesignConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer, Raphael) {
    return SvgBase.inherit({

        ctor: function(configuration) {
            if (!configuration) {
                throw "Configuration for viewer not defined";
            }

            this.$configuration = configuration;

            // create a renderer
            if (configuration instanceof TextConfiguration) {
                this.$renderer = new TextConfigurationRenderer({configuration: configuration});
            } else if (configuration instanceof DesignConfiguration) {
                this.$renderer = new DesignConfigurationRenderer({configuration: configuration});
            }

            this.$renderer.$configurationViewer = this;

        },

        _render: function(paper) {

            var svg = this.$renderer.render(paper),
                matrix = svg.matrix.clone();

            this._transform(svg);

            return svg;
        },

        _transform: function(svg) {

            svg = svg || this.$svg;

            if (!this.$configuration) {
                return;
            }

            var matrix = Raphael.matrix();
            matrix.translate(this.$configuration.get('offset.x'), this.$configuration.get('offset.y'));
            matrix.rotate(this.$configuration.get('rotation'), 0, 0);

            if (this.$printAreaViewer) {
                this.$printAreaViewer.transform(matrix);
            }

            svg.transform(matrix.toTransformString());

        },

        destroy: function() {
            if (this.$renderer) {
                this.$renderer.destroy();
            }

            this.callBase();
        }
    });
});