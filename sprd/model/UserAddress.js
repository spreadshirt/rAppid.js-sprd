define(['sprd/data/SprdModel', 'sprd/entity/Address', 'underscore'], function (SprdModel, AddressEntity, _) {

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
        compose: AddressEntity.prototype.compose
    });
});