define(["sprd/data/SprdModel", "js/data/Entity"], function (Model, Entity) {

    var Discount = Entity.inherit('sprd.entity.Discount', {


    });

    return Model.inherit('sprd.model.DiscountScale', {
        schema: {
            discounts: [Entity]
        },
        maxDiscount: function () {
            if (this.$.discounts && this.$.discounts.size()) {
                return this.$.discounts.at(this.$.discounts.size() - 1);
            }
            return "";
        }.onChange("discounts")
    });

});