define(['sprd/data/SprdModel', 'js/data/Collection', 'sprd/model/UserShop'], function (SprdModel, Collection, UserShop) {
	return SprdModel.inherit('sprd.model.User', {
        schema: {
            shops: Collection.of(UserShop)
        }
	});
});