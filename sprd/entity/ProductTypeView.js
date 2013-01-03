define(['js/data/Entity', 'sprd/entity/ViewMap', 'sprd/entity/Size'], function (Entity, ViewMap, Size) {
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

            var printArea,
                productType;

            if (this.$.viewMaps) {
                for (var i = 0; i < this.$.viewMaps.$items.length; i++) {
                    printArea = this.$.viewMaps.$items[i].$.printArea;
                    if (printArea) {
                        return printArea;
                    }
                }
            }

            productType = this.getProductType();

            if (productType) {
                return productType.getDefaultPrintArea();
            }

            return null;

        },

        getPrintAreas: function() {
            var printAreas = [];

            this.$.viewMaps.each(function (viewMap) {
                printAreas = printAreas.concat(viewMap.printAreas());
            });

            return printAreas;
        }
    });
});
