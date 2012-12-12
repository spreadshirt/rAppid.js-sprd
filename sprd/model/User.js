define(['sprd/data/SprdModel', 'js/data/Collection', 'sprd/model/Shop', "sprd/model/Design","sprd/model/ProductType", "sprd/model/Product"], function (SprdModel, Collection, Shop, Design, ProductType, Product) {
	return SprdModel.inherit('sprd.model.User', {
        schema: {
            shops: Collection.of(Shop),
            designs: Collection.of(Design),
            products: Collection.of(Product),
            productTypes: Collection.of(ProductType)
        }
	});
});