define(['js/svg/SvgElement'], function(SvgElement) {

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

//
//        ctor: function(printArea, viewMap) {
//
//            if (!printArea) {
//                throw "PrintArea for PrintAreaViewer not defined";
//            }
//
//            if (!viewMap) {
//                throw "ViewMap for PrintAreaViewer not defined";
//            }
//
//            this.$printArea = printArea;
//            this.$viewMap = viewMap;
//        },

//        _render: function(paper) {
//            var printArea = this.$printArea;
//
//            var rect = paper.rect(0, 0, printArea.boundary.size.width, printArea.boundary.size.height);
//            var matrix = rect.matrix.clone();
//
//            this.transform(matrix);
//            rect.transform(matrix.toTransformString());
//
//            return rect;
//        },

        transform: function(matrix) {

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