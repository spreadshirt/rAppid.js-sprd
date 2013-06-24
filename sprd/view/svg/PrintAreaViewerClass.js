define(['js/svg/SvgElement', 'xaml!sprd/view/svg/ConfigurationViewer', 'js/core/List'], function (SvgElement, ConfigurationViewer, List) {

    return SvgElement.inherit('sprd.view.svg.PrintAreaViewerClass', {

        defaults: {
            tagName: "g",
            componentClass: "print-area",

            productTypeViewViewer: null,
            product: null,
            productViewer: null,

            snapLines: null,

            snapLinesGroup: null,

            _viewMap: null,

            imageService: null
        },

        $classAttributes: ["product", "productTypeViewViewer", "productViewer", "snapLines", "snapLinesGroup", "imageService"],

        ctor: function () {

            this.$configurationViewerCache = {};
            this.callBase();
        },

        _commitProductViewer: function(productViewer) {

            if (productViewer && productViewer.$.editable) {
                this.$.snapLines = new List();
            } else {
                this.$.snapLines = null;
            }

        },

        _initializeRenderer: function () {

            // Could be done via binding, but viewMaps don't change at runtime and so just evalulating
            this.translate(this.get("_viewMap.offset.x"), this.get("_viewMap.offset.y"));

            var transformations = this.get("_viewMap.transformations.operations");
            if (transformations) {
                this.$.transformations.add(new SvgElement.Transform({
                    transform: transformations
                }));
            }

            var border = this.createComponent(SvgElement, {
                tagName: "rect",
                componentClass: "print-area-border",
                width: this.get('_viewMap.printArea.boundary.size.width'),
                height: this.get('_viewMap.printArea.boundary.size.height')
            });

            var softBoundary = this.get("_viewMap.printArea.boundary.soft.content.svg.path.d");

            if (softBoundary) {
                softBoundary = this.createComponent(SvgElement, {
                    tagName: "path",
                    componentClass: "soft-boundary-border",
                    d: softBoundary
                });
            }

            var defaultBox = this.get("_viewMap.printArea.defaultBox");
            if (defaultBox) {
                defaultBox = this.createComponent(SvgElement, {
                    tagName: "rect",
                    componentClass: "print-area-default-box",
                    x: defaultBox.x,
                    y: defaultBox.y,
                    width: defaultBox.width,
                    height: defaultBox.height
                });
            }

            this.addChild(border);

            defaultBox && this.addChild(defaultBox);
            softBoundary && this.addChild(softBoundary);

            var productViewer = this.$.productViewer;

            if (productViewer && productViewer.$.editable) {
                this.addChild(this.$.snapLinesGroup);
            }

            this.callBase();
        },

        initialize: function () {
            this.bind('product.configurations', 'add', this._onConfigurationAdded, this);
            this.bind('product.configurations', 'change', this._onConfigurationChanged, this);
            this.bind('product.configurations', 'remove', this._onConfigurationRemoved, this);
            this.bind('product.configurations', 'reset', this._onConfigurationsReset, this);

            this.callBase();
        },

        _onConfigurationsReset: function (e) {
            var self = this;

            this._removeConfigurationViewer();
            if (this.$.product && this.$.product.$.configurations) {
                this.$.product.$.configurations.each(function (configuration) {
                    self._addConfiguration(configuration);
                });
            }
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

            if (!configuration.$.printArea) {
                return;
            }

            if (configuration.$.printArea.$.id !== this.get('_viewMap.printArea.id')) {
                // not for this print area
                return;
            }

            var configurationId = configuration.$cid;

            if (!this.$configurationViewerCache.hasOwnProperty(configurationId)) {
                var viewer = this.$configurationViewerCache[configurationId] = this.createComponent(ConfigurationViewer, {
                    product: this.$.product,
                    printAreaViewer: this,
                    _viewMap: this.get("_viewMap"),
                    productViewer: this.$.productViewer,

                    configuration: configuration,

                    imageService: this.$.imageService
                });

                this.addChild(viewer);

                this.$.productViewer.trigger('add:configurationViewer',viewer);

            }
        },

        getViewerForConfiguration: function (configuration) {
            for (var key in this.$configurationViewerCache) {
                if (this.$configurationViewerCache.hasOwnProperty(key)) {
                    if (this.$configurationViewerCache[key].$.configuration === configuration) {
                        return this.$configurationViewerCache[key];
                    }
                }
            }
            return null;
        },

        _renderProduct: function (product, oldProduct) {

            if (oldProduct) {
                this._removeConfigurationViewer();
            }

            var self = this;
            if (product && product.$.configurations) {
                product.$.configurations.each(function (configuration) {
                    self._addConfiguration(configuration);
                });
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

        _removeConfigurationViewer: function () {
            for (var key in this.$configurationViewerCache) {
                if (this.$configurationViewerCache.hasOwnProperty(key)) {
                    var viewer = this.$configurationViewerCache[key];
                    viewer.remove();
                    viewer.destroy();
                }
            }

            this.$configurationViewerCache = {};
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