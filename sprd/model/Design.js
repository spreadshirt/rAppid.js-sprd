define(['sprd/data/SprdModel', 'sprd/model/PrintType', 'sprd/entity/Size', 'sprd/entity/DesignColor', 'sprd/entity/Price'], function (SprdModel, PrintType, Size, DesignColor, Price) {
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

            colors: [DesignColor],
            price: Price
        },

        parse: function(data){
            data = this.callBase();

            if (data.href) {
                data.wtfMbsId = data.id;
                data.id = data.href.split("/").pop();
            }

            return data;
        }
    });

});