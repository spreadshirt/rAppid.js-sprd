define(['js/data/Entity'], function (Entity) {
	return Entity.inherit('sprd.entity.ProductTypeView', {

		defaults : {
			productType : null
		},

		getDefaultPrintArea : function() {

			var defaultView = this.$.id,
				defaultPrintArea = null;

			this.$.productType.printAreas.each(function(value, key) {
				if (value.id === defaultView) {
					defaultPrintArea = value.id;
					return false;
				}
			});

			return defaultPrintArea;

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
