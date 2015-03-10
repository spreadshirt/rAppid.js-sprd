define(["js/data/Model"], function (Model) {

    return Model.inherit("sprd.pimp.model.Font", {

        schema: {
            title: String,
            restrict: String,
            icon: String,
            iconBig: String
        }

    });
});