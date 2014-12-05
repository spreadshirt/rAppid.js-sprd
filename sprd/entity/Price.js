define(['js/data/Entity', 'sprd/model/Currency'], function (Entity, Currency) {
    return Entity.inherit('sprd.entity.Price', {

        defaults: {
            vatExcluded: 0,
            vatIncluded: 0,
            display: 0,
            vat: 0,
            currency: Currency
        },

        schema: {
            vatExcluded: Number,
            vatIncluded: Number,
            vat: Number,
            display: Number,
            currency: Currency
        },

        formattedPrice: function () {
            var currency = this.$.currency;

            if (currency) {
                return currency.formatPrice(this);
            }

            return null;
        },

        add: function (price) {
            if (price) {
                this.set({
                    vatIncluded: this.$.vatIncluded + price.$.vatIncluded,
                    vatExcluded: this.$.vatExcluded + price.$.vatExcluded,
                    display: this.$.display + price.$.display
                });
            }
        }
    });

});