define([
	'xaml!sprd/view/Image'
], function (Image) {

	return Image.inherit('app.view.ProductTypeImage', {

		imageUrl : function () {
			if (this.$.productType && this.$.productType.$.resources) {
				return this.extendUrlWithSizes(this.$.productType.$.resources[0].href);
			}
			return "";
		}.onChange('width', 'height', 'productType'),

		alt : function () {
			if (this.$.productType) {
				return this.$.productType.$.name;
			}
			return null;
		}

	});

});