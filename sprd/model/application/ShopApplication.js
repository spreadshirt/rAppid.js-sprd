define(["sprd/model/Application", "js/core/Bindable"], function(Application, Bindable) {

    var ShopSettings = Bindable.inherit({
        defaults: {
            enableVirtualProducts: true
        }
    });

    return Application.inherit("sprd.model.application.ShopApplication", {
        defaults: {
            name: "shop5",
            settings: ShopSettings
        },

        idField: "name"

    });
});