define(['sprd/data/SprdModel', 'sprd/entity/Address', 'underscore'], function (SprdModel, AddressEntity, _) {

    /**
     * User Address shares the same interface and methods like Address but with some extensions
     *
     */
    var defaults = _.extend({
        shippingAddress: true,
        billingAddress: true,
        defaultBillingAddress: false,
        defaultShippingAddress: false
    }, AddressEntity.prototype.defaults);

    var schema = _.extend({
        shippingAddress: Boolean,
        billingAddress: Boolean,
        defaultBillingAddress: Boolean,
        defaultShippingAddress: Boolean
    }, AddressEntity.prototype.schema);

    return SprdModel.inherit('sprd.model.UserAddress', {
        defaults: defaults,
        schema: schema,
        validators: AddressEntity.validators,
        parse: AddressEntity.prototype.parse,
        compose: AddressEntity.prototype.compose,
        _commitChangedAttributes: AddressEntity.prototype._commitChangedAttributes,
        isPackStation: AddressEntity.prototype.isPackStation,
        supportsCounty: AddressEntity.prototype.supportsCounty,
        isStateRequired: AddressEntity.prototype.isStateRequired,
        needsZipCode: AddressEntity.prototype.needsZipCode
    });
});