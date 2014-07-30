define(["js/data/Entity", "sprd/entity/ShippingRegion"], function (Entity, ShippingRegion) {

    return Entity.inherit("sprd.entity.ShippingState", {

        defaults: {
            name: "",
            code: "",
            shippingRegion: null,
            shippingSupported: true,
            externalFulfillmentSupported: true
        },

        idField: "code",

        schema: {
            name: String,
            isoCode: String,
            shippingRegion: ShippingRegion,
            shippingSupported: Boolean,
            externalFulfillmentSupported: Boolean
        },

        parse: function (data) {

            if (data.isoCode) {
                data.code = data.isoCode;
                delete data.isoCode;
            }

            return this.callBase(data);

        }


    });
});
