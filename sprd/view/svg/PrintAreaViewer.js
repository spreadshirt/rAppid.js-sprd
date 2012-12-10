define(['js/svg/SvgElement'], function (SvgElement) {

    var rRotationExtractor = /^rotate\(((?:[\-0-9]*\s?)*)\)$/;

    return SvgElement.inherit('sprd/view/svg/PrintAreaViewer', {

        defaults: {
            tagName: "g",
            "class": "print-area"
        },

        $classAttributes: ["printArea"],

        _initializeRenderer: function (el) {

            var border = this.createComponent(SvgElement, {
                tagName: "rect",
                class: "print-area-border",
                width: this.get('printArea.boundary.size.width'),
                height: this.get('printArea.boundary.size.height')
            });

            this.addChild(border);

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
        },

        transform: function (matrix) {

            if (matrix) {
                var viewMap = this.$viewMap;

                matrix.translate(viewMap.offset.x, viewMap.offset.y);

                if (viewMap.transformations) {

                    var matches = viewMap.transformations.operations.match(rRotationExtractor);
                    if (matches && matches.length > 0) {
                        var par = matches[1].split(" ");
                        matrix.rotate(par[0], par[1], par[2]);
                    }
                }


            }

            return matrix;
        }

    });
});