define(["js/core/Bindable"], function (Bindable) {
    return Bindable.inherit("sprd.manager.IProductManager", {

        defaults: {
            removeConfigurationOutsideViewPort: true,
            removeConfigurationOutsidePrintArea: true
        },

        checkConfigurationOffset: function(product, configuration) {
        },

        initializeProduct: function (Product, callback) {
        }
    });
});