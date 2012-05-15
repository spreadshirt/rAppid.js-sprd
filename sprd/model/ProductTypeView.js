define([
	'sprd/data/SprdModel'
], function (SprdModel) {
	return SprdModel.inherit('sprd.model.ProductTypeView', {

		defaults : {
			productType : null
		},

		getDefaultPrintArea : function() {

			var defaultView = this.$.id
				, defaultPrintArea;

			this.$.productType.printAreas.each(function(value, key) {
				if (value.id === defaultView) {
					defaultPrintArea = value.id;
					return false;
				}
			});

			if (defaultPrintArea) return defaultPrintArea;
			return false;

		}

	});
});
