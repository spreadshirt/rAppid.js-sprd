define(['js/data/Entity', 'sprd/entity/Offset', 'sprd/entity/PrintArea'], function (Entity, Offset, PrintArea) {
	return Entity.inherit('sprd.entity.ViewMap', {

        defaults: {
            transformations: ""
        },

        schema: {
            transformations: String,
            printArea: PrintArea,
            offset: Offset
        },

        getProductType: function() {
            return this.$parent;
        },

		getDefaultPrintArea : function() {

			var defaultViewId = this.$.id,
				printArea, i;

            var printAreas = this.printAreas();

            for (i = 0; i < printAreas.length; i++) {
                printArea = printAreas[i];
                if (printArea.id === defaultViewId) {
                    return printArea;
                }
            }

            return printAreas[0];

		},

        getViewMaps: function() {
            var ret = [];

            var productType = this.$parent;

            if (productType) {
                for (var i = 0; i < this.$.viewMaps.length; i++) {
                    var viewMap = this.$.viewMaps[i];

                    if (viewMap.id === this.$.id) {
                        var printArea = productType.getPrintAreaById(viewMap.printArea.id);
                        if (printArea) {
                            ret.push(printArea);
                        }
                    }
                }
            }

            return ret;
        },

        printAreas: function() {
            var ret = [];

            var productType = this.$parent;

            if (productType) {
                for (var i = 0; i < this.$.viewMaps.length; i++) {
                    var viewMap = this.$.viewMaps[i];

                    if (viewMap.id === this.$.id) {
                        var printArea = productType.getPrintAreaById(viewMap.printArea.id);
                        if (printArea) {
                            ret.push(printArea);
                        }
                    }
                }
            }

            return ret;
        }

	});
});
