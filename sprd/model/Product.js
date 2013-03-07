define(['sprd/model/ProductBase', 'js/core/List', 'js/data/AttributeTypeResolver', 'sprd/entity/DesignConfiguration', 'sprd/entity/TextConfiguration', 'sprd/entity/Price', 'js/data/TypeResolver', 'js/data/Entity', "underscore", "flow", "sprd/manager/IProductManager"], function (ProductBase, List, AttributeTypeResolver, DesignConfiguration, TextConfiguration, Price, TypeResolver, Entity, _, flow, IProductManager) {

    var undef;

    return ProductBase.inherit("sprd.model.Product", {

        schema: {
            configurations: [new AttributeTypeResolver({
                attribute: "type",
                mapping: {
                    "design": DesignConfiguration,
                    "text": TextConfiguration
                }
            })]
        },

        defaults: {
            configurations: List
        },

        inject: {
            manager: IProductManager
        },

        ctor: function () {
            this.callBase();

            var priceChangeHandler = function () {
                this.trigger("priceChanged");
            };

            var productChangeHandler = function () {
                this.trigger("productChanged");
            };


            var configurationAdd = function (e) {
                this._setUpConfiguration(e.$.item);

                productChangeHandler.call(this);
                priceChangeHandler.call(this);
            };

            var configurationRemove = function (e) {

                this._tearDownConfiguration(e.$.item);

                productChangeHandler.call(this);
                priceChangeHandler.call(this);
            };

            this.bind("configurations", "add", configurationAdd, this);
            this.bind("configurations", "remove", configurationRemove, this);
            this.bind("configurations", "reset", priceChangeHandler, this);
            this.bind("configurations", "item:priceChanged", priceChangeHandler, this);

            this.bind('change:productType', productChangeHandler, this);
            this.bind('change:appearance', productChangeHandler, this);
            this.bind('configurations', 'reset', productChangeHandler, this);
            this.bind('configurations', 'item:configurationChanged', productChangeHandler, this);
            this.bind('configurations', 'item:change:printArea', productChangeHandler, this);

        },

        _setUpConfiguration: function (configuration) {

            if (!this.$stage) {
                return;
            }

            this.$stage.$bus.setUp(configuration);
        },

        _tearDownConfiguration: function (configuration) {

            if (!this.$stage) {
                return;
            }

            this.$stage.$bus.tearDown(configuration);
        },

        _postConstruct: function () {

            var configurations = this.$.configurations,
                self = this;

            if (configurations) {
                configurations.each(function (configuration) {
                    self._setUpConfiguration(configuration);
                });
            }
        },

        _preDestroy: function () {
            var configurations = this.$.configurations,
                self = this;

            if (configurations) {
                configurations.each(function (configuration) {
                    self._tearDownConfiguration(configuration);
                });
            }
        },

        price: function () {
            // TODO format price with currency
            if (this.$.price) {
                return this.$.price;
            } else {
                // calculate price
                var price = new Price({
                    vatIncluded: this.get("productType.price.vatIncluded"),
                    currency: this.get('productType.price.currency')
                });
                this.$.configurations.each(function (configuration) {
                    price.add(configuration.price());
                });

                return price;
            }
        }.on("priceChanged", "change:productType"),

        _addConfiguration: function (configuration) {
            this.$.configurations.add(configuration);
        },

        getConfigurationsOnView: function (view) {

            view = view || this.$.view;

            var productType = this.$.productType;

            if (view && productType) {

                if (productType.containsView(view)) {
                    return this.getConfigurationsOnPrintAreas(view.getPrintAreas());
                } else {
                    throw new Error("View not on product type");
                }

            }

            return [];

        },

        getConfigurationsOnPrintAreas: function (printAreas) {
            printAreas = printAreas || [];

            if (!(printAreas instanceof Array)) {
                printAreas = [printAreas];
            }

            var ret = [];

            this.$.configurations.each(function (configuration) {
                if (_.contains(printAreas, configuration.$.printArea)) {
                    ret.push(configuration);
                }
            });

            return ret;

        },

        compose: function () {
            var ret = this.callBase();

            ret.restrictions = {
                freeColorSelection: false,
                example: false
            };

            var viewId = this.get("view.id");

            if (viewId) {
                ret.defaultValues = {
                    defaultView: {
                        id: viewId
                    }
                };
            }

            return ret;
        },

        fetch: function (options, callback) {
            var self = this;
            this.callBase(options, function (err) {
                if (!err) {
                    self.$originalProduct = self.clone();
                }
                callback && callback(err, self);
            });
        },

        hasChanges: function () {
            return !this.$originalProduct.isDeepEqual(this);
        },

        save: function (options, callback) {

            if (this.$originalProduct) {
                if (this.hasChanges()) {
                    this.set('id', undef);
                } else {
                    callback && callback(null, this);
                    return;
                }
            }

            var self = this;
            this.callBase(options, function (err) {
                if (!err) {
                    self.$originalProduct = self.clone();
                }

                callback && callback(err, self);
            });
        },

        init: function (callback) {
            var self = this;

            flow()
                .seq(function (cb) {
                    if (self.isNew()) {
                        cb();
                    } else {
                        self.fetch(null, cb);
                    }
                })
                .seq(function (cb) {
                    var productType = self.$.productType;
                    productType.fetch(null, cb);
                })
                .seq(function () {
                    var productType = self.$.productType;

                    self.set({
                        appearance: productType.getAppearanceById(self.$.appearance.$.id),
                        view: self.$.view || productType.getViewById(self.get("defaultValues.defaultView.id")) || productType.getDefaultView()
                    });
                })
                .seq(function (cb) {
                    flow()
                        .parEach(self.$.configurations.$items, function (configuration, cb) {
                            self._setUpConfiguration(configuration);
                            configuration.init(cb);
                        })
                        .exec(cb);
                })
                .exec(function (err) {
                    if (err) {
                        callback && callback(err);
                    } else {
                        callback && callback(null, self);
                    }
                });
        },

        appearanceBrightness: function () {

            var color = this.get("appearance.getMainColor()");

            if (color) {
                return color.distanceTo("#000000") < color.distanceTo("#FFFFFF") ?
                    "dark" : "bright";
            }

            return "";
        }.onChange(["appearance"])

    });
});
