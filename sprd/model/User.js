define(['sprd/data/SprdModel', 'js/data/Collection', 'sprd/model/UserShop', "sprd/model/UserDesign"], function (SprdModel, Collection, UserShop, UserDesign) {
	return SprdModel.inherit('sprd.model.User', {
        schema: {
            shops: Collection.of(UserShop),
            designs: Collection.of(UserDesign)
        }
	});
});