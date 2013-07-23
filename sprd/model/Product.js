define(['sprd/model/ProductBase', 'js/core/List', 'js/data/AttributeTypeResolver', 'sprd/entity/DesignConfiguration', 'sprd/entity/TextConfiguration', 'sprd/entity/Price', 'js/data/TypeResolver', 'js/data/Entity', "underscore", "flow", "sprd/manager/IProductManager", "sprd/error/ProductCreationError"], function (ProductBase, List, AttributeTypeResolver, DesignConfiguration, TextConfiguration, Price, TypeResolver, Entity, _, flow, IProductManager, ProductCreationError) {

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
            this.configurationsOnViewCache = {};

            this.callBase();

            var priceChangeHandler = function () {
                this.trigger("priceChanged");
            };

            var productChangeHandler = function () {
                this.trigger("productChanged");
            };

            var configurationAdd = function (e) {
                var configuration = e.$.item,
                    viewId = configuration.get("printArea.getDefaultView().id");

                if (viewId) {
                    // clear configuration cache
                    this.configurationsOnViewCache[viewId] = null;
                    this.trigger("configurationValidChanged");
                }

                this._setUpConfiguration(configuration);

                if(configuration instanceof TextConfiguration){
                    configuration._composeText();
                }
                priceChangeHandler.call(this);
                productChangeHandler.call(this);

            };

            var configurationRemove = function (e) {
                var configuration = e.$.item,
                    viewId = configuration.get("printArea.getDefaultView().id");

                if (viewId) {
                    // clear configuration cache
                    this.configurationsOnViewCache[viewId] = null;
                    this.trigger("configurationValidChanged");
                }

                this._tearDownConfiguration(configuration);

                productChangeHandler.call(this);
                priceChangeHandler.call(this);
            };

            this.bind("configurations", "add", configurationAdd, this);
            this.bind("configurations", "remove", configurationRemove, this);
            this.bind("configurations", "reset", function() {
                this.configurationsOnViewCache = {};
                this.trigger("configurationValidChanged");

                priceChangeHandler.call(this);
                productChangeHandler.call(this);
            }, this);

            this.bind("configurations", "item:priceChanged", priceChangeHandler, this);
            this.bind('configurations', 'item:configurationChanged', productChangeHandler, this);
            this.bind('configurations', 'item:change:printArea', function() {
                this.configurationsOnViewCache = {};
                this.trigger("configurationValidChanged");

                productChangeHandler.call(this);
            }, this);

            this.bind('configurations', 'item:isValidChanged', function() {
                this.trigger("configurationValidChanged");
            }, this);

            this.bind('configurations', 'item:change:offset', this._onConfigurationOffsetChanged, this);

        },

        _onConfigurationOffsetChanged: function(e) {

            var manager = this.$.manager,
                configuration = e.$.item;

            if (manager && manager.checkConfigurationOffset) {
                manager.checkConfigurationOffset(this, configuration)
            }
        },

        configurationsOnViewErrorKey: function(view) {

            var errorKey = null,
                configurations;

            if (!view) {
                return null;
            }

            var viewId = view.$.id;

            configurations = this.configurationsOnViewCache[viewId];

            if (!configurations) {
                this.configurationsOnViewCache[viewId] = configurations = this.getConfigurationsOnView(view);
            }

            if (!configurations) {
                return null;
            }

            for (var i = 0; i < configurations.length; i++) {
                var configuration = configurations[i];

                if (!configuration.isValid() && configuration.$errors) {

                    for (var key in configuration.$errors.$) {
                        if (configuration.$errors.$.hasOwnProperty(key)) {
                            errorKey = configuration.$errors.$[key];
                            if (errorKey) {
                                errorKey = key;
                                break;
                            }
                        }
                    }
                }
            }

            this.configurationsOnViewCache[viewId].errorKey = errorKey;

            return errorKey;

        }.on("configurationValidChanged"),

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

            for (var i = 0; i < this.$.configurations.$items.length; i++) {
                var configuration = this.$.configurations.$items[i];
                if (_.contains(printAreas, configuration.$.printArea)) {
                    ret.push(configuration);
                }
            }


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
            return !(this.$.configurations.isDeepEqual(this.$originalProduct.$.configurations) &&
                this.$.appearance.isDeepEqual(this.$originalProduct.$.appearance) &&
                this.$.productType.isDeepEqual(this.$originalProduct.$.productType));
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
                } else {
                    err = ProductCreationError.createFromResponse(err);
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

                    var appearance;

                    if (self.$.appearance) {
                        appearance = productType.getAppearanceById(self.$.appearance.$.id);
                    }

                    appearance = appearance || productType.getDefaultAppearance();

                    self.set({
                        appearance: appearance,
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
        }.onChange(["appearance"]),

        isReadyForCompose: function () {
            var ready = true;

            if (this.$.configurations) {
                this.$.configurations.each(function (configuration) {
                    ready = ready && configuration.isReadyForCompose();
                });
            }

            return ready;
        },

        _commitChangedAttributes: function (attributes) {
            this.callBase();
            if (attributes.hasOwnProperty("appearance") || attributes.hasOwnProperty("productType")) {
                this.trigger("productChanged");
            }
        }

    });
});
