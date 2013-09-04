define(['js/data/Entity', 'sprd/entity/ViewMap', 'sprd/entity/Size', 'underscore'], function (Entity, ViewMap, Size, _) {
    return Entity.inherit('sprd.entity.ProductTypeView', {

        schema: {
            name: String,
            perspective: String,
            viewMaps: [ViewMap],
            size: Size
        },

        getProductType: function () {
            return this.$parent;
        },

        getDefaultPrintArea: function () {

            var printArea;

            if (this.$.viewMaps) {
                for (var i = 0; i < this.$.viewMaps.$items.length; i++) {
                    printArea = this.$.viewMaps.$items[i].$.printArea;
                    if (printArea) {
                        return printArea;
                    }
                }
            }

            return null;

        },

        getViewMapForPrintArea: function(printArea) {

            if (printArea) {
                for (var i = 0; i < this.$.viewMaps.$items.length; i++) {
                    var viewMap = this.$.viewMaps.$items[i];
                    if (viewMap && viewMap.$.printArea === printArea) {
                        return viewMap;
                    }

                }
            }

            return null;
        },


        getPrintAreas: function() {
            var printAreas = [];

            this.$.viewMaps.each(function (viewMap) {
                printAreas = printAreas.concat(viewMap.printAreas());
            });

            return printAreas;
        },

        containsPrintArea: function(printArea) {
            return printArea && _.indexOf(this.getPrintAreas(), printArea) !== -1;
        }
    });
});
