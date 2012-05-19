define(['js/data/Entity'], function (Entity) {
	return Entity.inherit('sprd.entity.ProductTypeView', {

		defaults : {
			productType : null
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

        getPrintAreaById: function(printAreaId) {
            if (this.$.productType) {
                for (var i = 0; i < this.$.viewMaps.length; i++) {
                    if (this.$.viewMaps[i].printArea.id === printAreaId) {
                        return this.$.productType.getPrintAreaById(this.$.viewMaps[i].printArea.id);
                    }
                }
            }

            return null;
        },

        printAreas: function() {
            var ret = [];

            if (this.$.productType) {
                for (var i = 0; i < this.$.viewMaps.length; i++) {
                    var printArea = this.$.productType.getPrintAreaById(this.$.viewMaps[i].printArea.id);
                    if (printArea) {
                        ret.push(printArea);
                    }
                }
            }

            return ret;
        }

	});
});
