define(['js/data/Entity', 'sprd/entity/ViewMap', 'sprd/entity/Size'], function (Entity, ViewMap, Size) {
	return Entity.inherit('sprd.entity.ProductTypeView', {

        schema: {
            name: String,
            perspective: String,
            viewMaps: [ViewMap],
            size: Size
        },

        getProductType: function() {
            return this.$parent;
        },

		getDefaultPrintArea : function() {

			var defaultViewId = this.$.id,
				printArea, i,
                productType = this.getProductType();

            if (productType) {
                var printAreas = productType.$.printAreas.$items;

                for (i = 0; i < printAreas.length; i++) {
                    printArea = printAreas[i];
                    if (printArea.$.id === defaultViewId) {
                        return printArea;
                    }
                }

                return productType.getDefaultPrintArea();
            }

            return null;

		}
	});
});
