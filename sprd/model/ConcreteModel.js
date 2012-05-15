define([
	'sprd/data/SprdModel'
], function (SprdModel) {
	return SprdModel.inherit('sprd.model.ConcreteModel', {
		defaults : {
			selectedAppearance : null,
			selectedSize       : null,
			product            : null
		}
	});
});
