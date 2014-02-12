define(['sprd/data/SprdModel', 'sprd/entity/Person', 'sprd/model/Country'], function (SprdModel, Person, Country) {
	return SprdModel.inherit('sprd.model.Address', {
        defaults: {
            person: null,
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
            companyName: String,
            tradeRegister: String,
            street: String,
            streetAnnex: String,
            houseNumber: String,
            zipCode: String,
            city: String,
            country: Country,
            email: String,
            phone: String,
            fax: String
        }
	});
});