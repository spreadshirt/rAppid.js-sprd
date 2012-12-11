define(['sprd/data/SprdModel', 'sprd/model/PrintType', 'sprd/entity/Size', 'sprd/entity/Color', 'sprd/entity/Price'], function (SprdModel, PrintType, Size, Color, Price) {
	return SprdModel.inherit('sprd.model.Design', {
		defaults : {
			name         : '',
			description  : '',
			restrictions : null
		},

        schema: {
            name: String,
            description: String,
            size: Size,
            printTypes: [PrintType] ,


            tags: String,

            colors: [Color],
            price: Price
        }
    });

});