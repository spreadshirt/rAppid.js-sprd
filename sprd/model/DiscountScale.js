define(["sprd/data/SprdModel", "js/data/Entity"], function (Model, Entity) {

    return Model.inherit('sprd.model.DiscountScale', {
        schema: {
            discounts: [Entity]
        },
        maxDiscount: function () {
            if (this.$.discounts && this.$.discounts.size()) {
                return this.$.discounts.at(this.$.discounts.size() - 1);
            }
            return "";
        }.onChange("discounts"),

        getDiscountById: function (discountId) {
            var currentDiscount = null;
            if (discountId && this.$.discounts) {
                this.$.discounts.each(function (discountItem) {
                    if (discountItem.$.id === discountId) {
                        currentDiscount = discountItem;
                        this["break"]();
                    }
                });
            }

            return currentDiscount;
        }.onChange('discounts')

    });

});