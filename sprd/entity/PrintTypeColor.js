define(['js/data/Entity', 'sprd/entity/Price', 'js/type/Color'], function (Entity, Price, Color) {
    return Entity.inherit('sprd.entity.PrintTypeColor', {

        defaults: {
            price: Price
        },

        schema: {
            name: String,
            fill: String,
            price: Price
        },

        parse: function (data) {
            data = this.callBase();
            data.fill = Color.parse(data.fill);
            return data;
        },

        getPrintType: function() {
            return this.$parent;
        },

        color: function () {
            return this.$.fill;
        },

        toHexString: function () {

            if (this.$.fill) {
                return this.$.fill.toRGB().toString();
            }

            return null;
        }
    });
});