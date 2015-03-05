define(["js/data/Model", "sprd/entity/Price"], function (Model, Price) {

    return Model.inherit("sprd.pimp.model.Commission", {

        schema: {
            price: Price
        }

    });
});