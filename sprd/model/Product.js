define([
    "sprd/data/SprdModel",
    'js/core/List',
    'sprd/model/ProductType',
    'js/data/AttributeTypeResolver',
    'sprd/entity/DesignConfiguration',
    'sprd/entity/TextConfiguration',
    'sprd/entity/Appearance',
    'js/data/TypeResolver', 'js/data/Entity', "underscore", "flow", "sprd/util/ProductUtil"],
    function (SprdModel, List, ProductType, AttributeTypeResolver, DesignConfiguration, TextConfiguration, Appearance, TypeResolver, Entity, _, flow, ProductUtil) {
        return SprdModel.inherit("sprd.model.Product", {

            schema: {
                productType: ProductType,
                appearance: {
                    type: Appearance,
                    isReference: true
                },
                configurations: [new AttributeTypeResolver({
                    attribute: "type",
                    mapping: {
                        "design": DesignConfiguration,
                        "text": TextConfiguration
                    }
                })],
                restrictions: Object
            },

            defaults: {
                productType: null,
                appearance: null,
                view: null,
                configurations: List
            },

            price: function () {
                // TODO format price with currency
                return this.$.price.vatIncluded;
            },

            getDefaultView: function () {

                if (this.$.productType) {
                    var defaultViewId = this.getDefaultViewId();

                    if (defaultViewId !== null) {
                        return this.$.productType.getViewById(defaultViewId);
                    } else {
                        return this.$.productType.getDefaultView();
                    }
                }

            },

            getDefaultViewId: function(){
                if (this.$.defaultValues) {
                    return this.$.defaultValues.defaultView.id;
                }
                return null;
            },

            getDefaultAppearance: function() {
                if(this.$.appearance && this.$.productType){
                    return this.$.productType.getAppearanceById(this.$.appearance.$.id);
                }
            },

            _addConfiguration: function(configuration) {
                this.$.configurations.add(configuration);
            },

            /***
             * set the product type and converts all configurations
             *
             * @param {sprd.model.ProductType} productType
             * @param callback
             */
            setProductType: function(productType, callback) {

                var self = this,
                    appearance,
                    view;

                flow()
                    .seq(function(cb) {
                        productType.fetch(null, cb);
                    })
                    .seq(function() {
                        if (self.$.appearance) {
                            appearance = productType.getClosestAppearance(self.$.appearance.getMainColor());
                        } else {
                            appearance = productType.getDefaultAppearance();
                        }
                    })
                    .seq(function() {
                        // determinate closest view for new product type
                        var currentView = self.$.view;

                        if (currentView) {
                            view = productType.getViewByPerspective(currentView.$.perspective);
                        }

                        if (!view) {
                            view = productType.getDefaultView();
                        }

                    })
                    .seq(function () {
                        // TODO: convert all configurations: size, position, print type

                        var configurations = self.$.configurations.$items,
                            removeConfigurations = [];

                        for (var i = 0; i < configurations.length; i++) {
                            var configuration = configurations[i],
                                currentPrintArea = configuration.$.printArea,
                                currentView = currentPrintArea.getDefaultView(),
                                targetView = null,
                                targetPrintArea = null;

                            if (currentView) {
                                targetView = productType.getViewByPerspective(currentView.$.perspective);
                            }

                            if (targetView) {
                                targetPrintArea = targetView.getDefaultPrintArea();
                            }

                            if (targetPrintArea) {
                                configuration.set('printArea', targetPrintArea);

                                var factor = targetPrintArea.get("boundary.size.width") / currentPrintArea.get("boundary.size.width");
                                configuration.set('scale', {
                                    x: configuration.$.scale.x * factor,
                                    y: configuration.$.scale.y * factor
                                });
                                configuration.$.offset.set({
                                    x: configuration.$.offset.$.x * factor,
                                    y: configuration.$.offset.$.y * factor
                                });

                            } else {
                                // no print area found, remove configuration
                                removeConfigurations.push(configuration);
                            }
                        }

                        self.$.configurations.remove(removeConfigurations);

                    })
                    .seq(function() {
                        // first set product type
                        self.set("productType", productType);
                        // and then the appearance, because appearance depends on product type
                        self.set({
                            view: view,
                            appearance: appearance
                        });
                    })
                    .exec(callback)

            },

            addDesign: function (params, callback) {
                params = _.defaults({}, params, {
                    design: null,
                    perspective: null, // front, back, etc...
                    view: null,
                    printArea: null,
                    printType: null
                });

                var self = this,
                    design = params.design,
                    productType = this.$.productType,
                    printArea = params.printArea,
                    view = params.view,
                    appearance = this.$.appearance,
                    printType = params.printType;

                if (!design) {
                    callback(new Error("No design"));
                    return;
                }

                if (!productType) {
                    callback(new Error("ProductType not set"));
                    return;
                }

                if (!appearance) {
                    callback(new Error("Appearance for product not set"));
                    return;
                }

                flow()
                    .par(function (cb) {
                        design.fetch(null, cb);
                    }, function (cb) {
                        productType.fetch(null, cb);
                    })
                    .seq("printArea", function () {

                        if (!printArea && params.perspective && !view) {
                            view = productType.getViewByPerspective(params.perspective);
                        }

                        if (!printArea && view) {
                            // get print area by view
                            if (!productType.containsView(view)) {
                                throw new Error("View not on ProductType");
                            }

                            // TODO: look for print area that supports print types, etc...
                            printArea = view.getDefaultPrintArea();
                        }

                        view = self.$.view || self.getDefaultView();
                        if (!printArea && view) {
                            printArea = view.getDefaultPrintArea();
                        }

                        if (!printArea) {
                            throw new Error("target PrintArea couldn't be found.");
                        }

                        return printArea;
                    })
                    .seq("printType", function() {
                        var possiblePrintTypes = ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(design, printArea, appearance.$.id);

                        if (printType && !_.contains(possiblePrintTypes, printType)) {
                            throw new Error("PrintType not possible for design and printArea");
                        }

                        printType = printType || possiblePrintTypes[0];

                        if (!printType) {
                            throw new Error("No printType available");
                        }

                        return printType;
                    })
                    .seq(function(cb) {
                        printType.fetch(null, cb);
                    })
                    .seq(function() {
                        var configuration = new DesignConfiguration({
                            printType: printType,
                            printArea: printArea,
                            design: design
                        });

                        self._addConfiguration(configuration);
                    })
                    .exec(callback)

            } ,

            compose: function(){
                var ret = this.callBase();

                ret.restrictions = {
                    freeColorSelection: false,
                    example: false
                };

                return ret;
            }
        });
    });
