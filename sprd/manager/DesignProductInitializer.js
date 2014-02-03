define(["sprd/manager/IProductInitializer", "sprd/manager/ProductManager", "sprd/manager/DesignConfigurationManager"], function (IProductInitializer, ProductManager, DesignConfigurationManager) {

    return IProductInitializer.inherit("sprd.manager.DesignProductInitializer", {

        _addFactories: function(injection) {

            injection.addFactory({
                factory: ProductManager,
                singleton: true
            });

            injection.addFactory({
                factory: DesignConfigurationManager,
                singleton: true
            });

        }

    });

});