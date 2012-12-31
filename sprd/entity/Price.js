define(['js/data/Entity', 'sprd/model/Currency'], function(Entity, Currency) {
    return Entity.inherit('sprd.entity.Price', {

        defaults: {
            vatExcluded: 0,
            vatIncluded: 0,
            vat: 0,
            currency: Currency
        },

        schema: {
            vatExcluded: Number,
            vatIncluded: Number,
            vat: Number,
            currency: Currency
        },

        formattedPrice: function () {
            var currency = this.$.currency;

            if (currency) {
                return currency.formatPrice(this.$.price.vatIncluded);
            }

            return null;
        }
    })
});