define(["js/data/Entity"], function (Entity) {


    return Entity.inherit('sprd.entity.Country', {
        schema: {

        },
        idField: "code",
        isEqual: function (country) {
            if (!country) {
                return false;
            }

            return country.get('code') == this.$.code;
        }
    });

});