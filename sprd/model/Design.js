define(['sprd/data/SprdModel'], function (SprdModel) {
	return SprdModel.inherit('sprd.model.Design', {
		defaults : {
			name         : '',
			description  : '',
			restrictions : null
		},

        schema: {
            name: String,
            description: String,
            type: String
        }
    });

});