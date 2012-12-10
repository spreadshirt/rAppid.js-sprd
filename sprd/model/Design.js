define(['sprd/data/SprdModel', 'sprd/model/PrintType'], function (SprdModel, PrintType) {
	return SprdModel.inherit('sprd.model.Design', {
		defaults : {
			name         : '',
			description  : '',
			restrictions : null
		},

        schema: {
            name: String,
            description: String,
            printTypes: [PrintType]
        }
    });

});