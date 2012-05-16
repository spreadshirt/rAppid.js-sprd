define([
	'xaml!sprd/view/Image'
], function (Image) {

	return Image.inherit('app.view.ProductTypeImage', {

		$classAttributes : ['productType'],

		imageUrl : function () {
			if (this.$.productType) {
				return this.extendUrlWithSizes(this.$.productType.$.resources[0].href);
			}
			return null;
		}.onChange('width', 'height', 'productType'),

		alt : function () {
			if (this.$.productType) {
				return this.$.productType.$.name;
			}
			return null;
		}

	});

});