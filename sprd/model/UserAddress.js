define(['sprd/model/Address', 'sprd/entity/Country'], function (Address, Country) {
    return Address.inherit('sprd.model.UserAddress', {
        schema: {
            country: {type: Country, isReference: true}
        }
    });
});