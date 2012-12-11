define(['js/svg/SvgElement', 'sprd/view/svg/ConfigurationViewer'], function (SvgElement, ConfigurationViewer) {

    return SvgElement.inherit('sprd.view.svg.PrintAreaViewer', {

        defaults: {
            tagName: "g",
            componentClass: "print-area",

            productTypeViewViewer: null,
            product: null,

            _viewMap: null
        },

        $classAttributes: ["product", "productTypeViewViewer"],

        ctor: function () {

            this.$configurationViewerCache = {};

            this.callBase();
        },

        _initializeRenderer: function () {

            // Could be done via binding, but viewMaps don't change at runtime and so just evalulating
            this.translate(this.get("_viewMap.offset.x"), this.get("_viewMap.offset.y"));
            this.transform(this.get("_viewMap.transform"));

            var border = this.createComponent(SvgElement, {
                tagName: "rect",
                componentClass: "print-area-border",
                width: this.get('_viewMap.printArea.boundary.size.width'),
                height: this.get('_viewMap.printArea.boundary.size.height')
            });

            this.addChild(border);

            this.callBase();
        },

        initialize: function () {
            this.bind('product.configurations', 'add', this._onConfigurationAdded, this);
            this.bind('product.configurations', 'change', this._onConfigurationChanged, this);
            this.bind('product.configurations', 'remove', this._onConfigurationRemoved, this);

            this.callBase();
        },

        _onConfigurationAdded: function (e) {
            this._addConfiguration(e.$.item);
        },

        _onConfigurationRemoved: function (e) {
            this._removeConfiguration(e.$.item);
        },

        _addConfiguration: function (configuration) {

            if (!configuration) {
                return;
            }

            var configurationId = configuration.$cid;

            if (!this.$configurationViewerCache.hasOwnProperty(configurationId)) {
                var viewer = this.$configurationViewerCache[configurationId] = this.createComponent(ConfigurationViewer, {
                    product: this.$.product,
                    printAreaViewer: this,

                    configuration: configuration
                });

                this.addChild(viewer);


            }
        },


        _removeConfiguration: function (configuration) {

            if (!configuration) {
                return;
            }

            var viewer = this.$configurationViewerCache[configuration.$cid];
            if (viewer) {
                viewer.remove();
                viewer.destroy();
            }
        },

        _onConfigurationChanged: function (e) {
            // remove or add
            if (e && this._hasSome(e.$.changedAttributes, ["printArea"])) {
                var configuration = e.$.item;
                if (configuration.$.printArea === this.get('_viewMap.printArea')) {
                    this._addConfiguration(configuration);
                } else {
                    this._removeConfiguration(configuration);
                }
            }
        }

    });
});