define(['js/svg/SvgElement'], function (SvgElement) {

    return SvgElement.inherit('sprd/view/svg/PrintAreaViewer', {

        defaults: {
            tagName: "g",
            componentClass: "print-area",

            productTypeViewViewer: null,
            product: null,

            _viewMap: null
        },

        $classAttributes: ["product", "productTypeViewViewer"],


        _initializeRenderer: function () {

            // Could be done via binding, but viewMaps don't change at runtime and so just evalulating
            this.translate(this.get("_viewMap.offset.x"), this.get("_viewMap.offset.y"));
            this.transform(this.get("_viewMap.transform"));

            var border = this.createComponent(SvgElement, {
                tagName: "rect",
                componentClass: "print-area-border",
                width: '{_viewMap.printArea.boundary.size.width}',
                height: '{_viewMap.printArea.boundary.size.height}'
            });

            this.addChild(border);

            this.callBase();
        },

        initialize: function () {

            this.bind(['product.configurations', 'add'], this._onConfigurationAdded);
            this.bind(['product.configurations', 'change'], this._onConfigurationChanged);
            this.bind(['product.configurations', 'remove'], this._onConfigurationRemoved);

            this.callBase();
        },

        _onConfigurationAdded: function () {
            console.log("added", arguments);
        },

        _onConfigurationRemoved: function () {
            console.log("removed", arguments);
        },

        _onConfigurationChanged: function () {
            console.log("changed", arguments);
        }

    });
});