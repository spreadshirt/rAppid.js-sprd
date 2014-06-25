define(['sprd/data/SprdModel', 'sprd/entity/Person', 'sprd/model/Country'], function (SprdModel, Person, Country) {
	return SprdModel.inherit('sprd.model.Address', {
        defaults: {
            person: Person,
            companyName: '',
            tradeRegister: '',
            street: '',
            streetAnnex: '',
            houseNumber: '',
            zipCode: '',
            city: '',
            country: '',
            email: '',
            phone: '',
            fax: ''
        },
        schema: {
            person: Person,
            companyName: {type: String, required: false},
            tradeRegister: {type: String, required: false},
            street: String,
            streetAnnex: {type: String, required: false},
            houseNumber: {type: String, required: false},
            zipCode: String,
            city: String,
            country: Country,
            email: {type: String, required: false},
            phone: {type: String, required: false},
            fax: {type: String, required: false}
        }
	});
});