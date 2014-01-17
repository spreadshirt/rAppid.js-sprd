define(["js/core/Component", "js/core/Injection", "flow", "js/core/Bus", "sprd/manager/IProductManager", "sprd/manager/IDesignConfigurationManager", "sprd/manager/ITextConfigurationManager", "sprd/model/User"], function (Component, Injection, flow, Bus, IProductManager, IDesignConfigurationManager, ITextConfigurationManager, User) {

    return Component.inherit("sprd.manager.IProductInitializer", {

        defaults: {
            productManager: null,
            designConfigurationManager: null,
            textConfigurationManager: null
        },

        inject: {
            bus: Bus,
            context: "context"
        },

        ctor: function () {
            this.callBase();

            var injection = this.$injection = this.createComponent(Injection);
            this._addFactories(injection);
        },

        _addFactories: function(injection) {
            // hook
        },

        _initializationComplete: function() {

            this.callBase();

            var bus = this.$.bus,
                injection = this.$injection;

            var productManager = injection.getInstance(IProductManager);
            var designConfigurationManager;
            var textConfigurationManager;

            try {
                designConfigurationManager = injection.getInstance(IDesignConfigurationManager);
            } catch (e) {
                // ok, if no products with designs are loaded
            }

            try {
                textConfigurationManager = injection.getInstance(ITextConfigurationManager);
            } catch (e) {
                // ok, if no products with text are loaded
            }

            bus.setUp(productManager);
            designConfigurationManager && bus.setUp(designConfigurationManager);
            textConfigurationManager && bus.setUp(textConfigurationManager);

            this.set({
                productManager: productManager,
                designConfigurationManager: designConfigurationManager,
                textConfigurationManager: textConfigurationManager
            });
        },

        initializeArticle: function(article, callback) {
            var self = this;

            //noinspection JSValidateTypes
            flow()
                .seq(function(cb) {
                    article.fetch(null, cb);
                })
                .seq("product", function(cb) {
                    self.initializeProduct(article.$.product, cb);
                })
                .exec(function(err, results) {
                    callback && callback(err, results.product);
                });
        },

        initializeProduct: function(product, callback) {

            var bus = this.$.bus,
                self = this;

            //noinspection JSValidateTypes
            flow()
                .seq(function(cb) {
                    self.$.context.getCollection("printTypes").fetch({
                        fullData: true
                    }, cb);
                })
                .seq(function(cb) {
                    bus.setUp(product);
                    product.init(cb);
                })
                .exec(function(err) {
                    callback && callback(err, product);
                });
        }
    });

});