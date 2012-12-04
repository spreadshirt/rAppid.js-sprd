define(['sprd/data/SprdModel', 'js/data/Collection', 'sprd/model/UserShop', "sprd/model/UserDesign","sprd/model/UserProductType", "sprd/model/UserProduct"], function (SprdModel, Collection, UserShop, UserDesign, UserProductType, UserProduct) {
	return SprdModel.inherit('sprd.model.User', {
        schema: {
            shops: Collection.of(UserShop),
            designs: Collection.of(UserDesign),
            products: Collection.of(UserProduct),
            productTypes: Collection.of(UserProductType)
        }
	});
});