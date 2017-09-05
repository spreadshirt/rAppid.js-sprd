define(["sprd/manager/IConfigurationManager", "xaml!sprd/data/DesignerApiDataSource",], function (Base, DesignerApiDataSource) {
    return Base.inherit("sprd.manager.IDesignConfigurationManager", {
        inject: {
            designerApi: DesignerApiDataSource
        },

        initializeConfiguration: function (configuration, options, callback) {
        }
    });
});