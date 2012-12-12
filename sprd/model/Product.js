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
                appearance: Appearance,
                configurations: [new AttributeTypeResolver({
                    attribute: "type",
                    mapping: {
                        "design": DesignConfiguration,
                        "text": TextConfiguration
                    }
                })]
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

            }
        });
    });
