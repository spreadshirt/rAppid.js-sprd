define(["sprd/manager/IProductManager", "underscore", "flow", "sprd/util/ProductUtil", "sprd/util/ArrayUtil", 'text/entity/TextFlow', 'sprd/type/Style', 'sprd/entity/DesignConfiguration', 'sprd/entity/TextConfiguration', 'sprd/entity/SpecialTextConfiguration', 'text/operation/ApplyStyleToElementOperation', 'text/entity/TextRange', 'sprd/util/UnitUtil', 'js/core/Bus', 'sprd/manager/PrintTypeEqualizer', "sprd/entity/BendingTextConfiguration", "sprd/entity/Scale", "js/core/List", "sketchomat/util/PrintValidator"],
    function(IProductManager, _, flow, ProductUtil, ArrayUtil, TextFlow, Style, DesignConfiguration, TextConfiguration, SpecialTextConfiguration, ApplyStyleToElementOperation, TextRange, UnitUtil, Bus, PrintTypeEqualizer, BendingTextConfiguration, Scale, List, PrintValidator) {


        var PREVENT_VALIDATION_OPTIONS = {
            preventValidation: true
        };
        // factor * print area height = font size
        var INITIAL_FONT_SIZE_SCALE_FACTOR = 0.07;

        return IProductManager.inherit("sprd.manager.ProductManager", {

            inject: {
                bus: Bus
            },

            events: [
                "on:removedConfigurations"
            ],

            /***
             * set the product type and converts all configurations
             *
             * @param {sprd.model.Product} product
             * @param {sprd.model.ProductType} productType
             * @param {sprd.entity.Appearance} appearance
             * @param callback
             */
            setProductType: function(product, productType, appearance, callback) {
                if (appearance instanceof Function) {
                    callback = appearance;
                    appearance = null;
                }
                var self = this,
                    view;

                flow()
                    .seq(function(cb) {
                        productType.fetch(null, cb);
                    })
                    .seq(function() {
                        if (!appearance) {
                            if (product.$.appearance) {
                                appearance = productType.getClosestAppearance(product.$.appearance.getMainColor());
                            } else {
                                appearance = productType.getDefaultAppearance();
                            }
                        }
                    })
                    .seq(function() {
                        var currentView = product.$.view;

                        if (currentView) {
                            view = productType.getViewByPerspective(currentView.$.perspective);
                        }

                        if (!view) {
                            view = productType.getDefaultView();
                        }

                    })
                    .seq(function() {
                        self.convertConfigurations(product, productType, appearance);
                    })
                    .seq(function() {
                        // first set product type
                        // and then the appearance, because appearance depends on product type
                        product.set({
                            productType: productType,
                            view: view,
                            appearance: appearance
                        });

                        self.$.bus.trigger('Application.productChanged', product);
                    })
                    .exec(callback);

            },

            setAppearance: function(product, appearance) {

                if (product.$.appearance.$.id === appearance.$.id) {
                    // same appearance, nothing to do
                    return;
                }

                this.convertConfigurations(product, product.$.productType, appearance);
                product.set({
                    appearance: appearance
                });
                this.$.bus && this.$.bus.trigger('Application.productChanged', product);
            },

            /***
             * Converts the configurations of a product with the given productType and appearance
             * @param {sprd.model.Product} product
             * @param {sprd.model.ProductType} productType
             * @param {sprd.entity.Appearance} appearance
             */
            convertConfigurations: function(product, productType, appearance) {
                var self = this;
                product.removeExampleConfiguration();
                var removedConfigurations = _.filter(product.$.configurations.$items, function(configuration) {
                    return !self.convertConfiguration(product, configuration, productType, appearance);
                });

                if (removedConfigurations.length) {
                    self.trigger('on:removedConfigurations', {configurations: removedConfigurations}, self);
                    product.$.configurations.remove(removedConfigurations);
                }
            },

            getFirstDigital: function(possiblePrintTypes) {
                return _.find(possiblePrintTypes, function(printType) {
                    return !printType.isPrintColorColorSpace();
                });
            },

            getInitialPrintType: function(configuration, possiblePrintTypes) {
                var initialPrintType = configuration.$.printType;
                if (initialPrintType && !_.contains(possiblePrintTypes, initialPrintType)) {
                    // print type not possible any more
                    initialPrintType = null;
                }

                // if digital print type
                // try to find another digital print type which is before the current print type
                // this is needed to switch back from DD to DT
                var firstDigital = this.getFirstDigital(possiblePrintTypes);
                if (initialPrintType && !initialPrintType.isPrintColorColorSpace() && firstDigital) {
                    initialPrintType = firstDigital;
                }
                return initialPrintType;
            },

            /***
             * Converts a configuration of a product with the given productType and appearance
             * @param {sprd.model.Product} product
             * @param {sprd.model.Configuration} configuration
             * @param {sprd.model.ProductType} productType
             * @param {sprd.entity.Appearance} appearance
             * @returns {Boolean} If the conversion was successful
             */
            convertConfiguration: function(product, configuration, productType, appearance) {
                var self = this;
                var closestView = productType.getViewByConfiguration(configuration);
                var closestPrintArea = closestView ? closestView.getDefaultPrintArea() : productType.getDefaultPrintArea();
                var printAreas = [closestPrintArea].concat(productType.$.printAreas.$items);

                var targetPrintArea = configuration.getPreferredPrintArea(printAreas, appearance);
                var possiblePrintTypes = configuration.getPossiblePrintTypesForPrintArea(targetPrintArea, appearance);

                if (targetPrintArea) {
                    var initialPrintType = this.getInitialPrintType(configuration, possiblePrintTypes);
                    if (initialPrintType) {
                        ArrayUtil.move(possiblePrintTypes, initialPrintType, 0);
                    }

                    var printType = _.find(possiblePrintTypes, function(print) {
                        return self.validateMove(print, targetPrintArea, configuration, product);
                    });


                    if (printType) {
                        if (configuration instanceof TextConfiguration || configuration instanceof BendingTextConfiguration) {
                            configuration.setColor(0, self.getPrintTypeColor(printType, appearance));
                        }
                        self._moveConfigurationToView(product, configuration, printType, targetPrintArea);
                        return true;
                    }
                }

                return false;
            },

            /**
             * Adds a design to a given Product
             * @param {sprd.model.Product} product
             * @param {Object} params
             * @param {Function} callback
             */
            addDesign: function(product, params, callback) {
                params = _.defaults({}, params, {
                    design: null,
                    perspective: null, // front, back, etc...
                    view: null,
                    printArea: null,
                    printType: null,
                    designColorRGBs: null,
                    designColorIds: null
                });

                var self = this,
                    bus = this.$.bus,
                    design = params.design,
                    productType = product.$.productType,
                    printArea = params.printArea,
                    view = params.view,
                    appearance = product.$.appearance,
                    printType = params.printType,
                    possiblePrintTypes;

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
                    .par(function(cb) {
                        design.fetch(null, cb);
                    }, function(cb) {
                        productType.fetch(null, cb);
                    })
                    .seq("printArea", function() {

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

                        view = product.$.view || product.getDefaultView();
                        if (!printArea && view) {
                            printArea = view.getDefaultPrintArea();
                        }

                        if (!printArea) {
                            throw new Error("target PrintArea couldn't be found.");
                        }

                        if (printArea.get("restrictions.designAllowed") === false) {
                            throw new Error("designs cannot be added to this print area");
                        }

                        return printArea;
                    })
                    .seq("printType", function() {
                        possiblePrintTypes = ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(design, printArea, appearance);

                        if (printType && !_.contains(possiblePrintTypes, printType)) {
                            throw new Error("PrintType not possible for design and printArea");
                        }

                        printType = PrintTypeEqualizer.getPreferredPrintType(product, printArea, possiblePrintTypes, possiblePrintTypes[0]) || printType || possiblePrintTypes[0];

                        if (!printType) {
                            throw new Error("No printType available");
                        }

                        return printType;
                    })
                    .seq(function(cb) {
                        printType.fetch(null, cb);
                    })
                    .seq("designConfiguration", function() {
                        var entity = product.createEntity(DesignConfiguration);
                        entity.set({
                            printType: printType,
                            printArea: printArea,
                            design: design,
                            designColorIds: params.designColorIds,
                            designColorRGBs: params.designColorRGBs
                        }, PREVENT_VALIDATION_OPTIONS);
                        return entity;
                    })
                    .seq(function(cb) {
                        var designConfiguration = this.vars["designConfiguration"];
                        bus.setUp(designConfiguration);
                        designConfiguration.init({}, cb);
                    })
                    .seq(function() {
                        self.positionConfiguration(this.vars["designConfiguration"]);
                    })
                    .exec(function(err, results) {
                        if (!err) {
                            product.removeExampleConfiguration();
                            product._addConfiguration(results.designConfiguration);
                        }
                        self.$.bus.trigger('Application.productChanged', product);
                        callback && callback(err, results.designConfiguration);
                    });

            },

            addText: function(product, params, callback) {

                var self = this;

                var finalizeFnc = function(configuration, params) {

                    configuration.$.selection.set({
                        activeIndex: configuration.$.textFlow.textLength() - 1,
                        anchorIndex: 0
                    });

                    configuration.set('isNew', params.isNew);

                    configuration.set("maxHeight", 1);

                    // determinate position
                    self.positionConfiguration(configuration);

                    configuration.set("maxHeight", null);

                };

                var configurationFnc = function(params, text, printType, printArea, font, printTypeColor) {

                    var textFlow = TextFlow.initializeFromText(text);

                    var fontSize = params.fontSize;

                    if (!printType.isPrintColorColorSpace()) {
                        fontSize = INITIAL_FONT_SIZE_SCALE_FACTOR * printArea.get('_size.height');
                    }

                    (new ApplyStyleToElementOperation(TextRange.createTextRange(0, textFlow.textLength()), textFlow, new Style({
                        font: font,
                        fontSize: fontSize,
                        lineHeight: 1.2,
                        printTypeColor: printTypeColor
                    }), new
                        Style({
                        textAnchor: "middle"
                    }))).doOperation();

                    var entity = product.createEntity(TextConfiguration);

                    entity.set({
                        printType: printType,
                        printArea: printArea,
                        textFlow: textFlow,
                        selection: TextRange.createTextRange(0, textFlow.textLength())
                    });
                    return entity;

                };

                this._addText(product, params, configurationFnc, finalizeFnc, callback);


            },

            addBendingText: function(product, params, callback) {

                var self = this;

                var createConfigurationFnc = function(params, text, printType, printArea, font, printTypeColor) {
                    var fontSize = params.fontSize,
                        printColors = new List;

                    printColors.add(printTypeColor);

                    var entity = product.createEntity(BendingTextConfiguration);

                    entity.set({
                        printType: printType,
                        printArea: printArea,
                        text: text,
                        fontSize: fontSize,
                        font: font,
                        printColors: printColors
                    });
                    return entity;
                };

                var finalizeFnc = function(configuration) {
                    configuration.set('isNew', params.isNew);

                    configuration.set("maxHeight", 1);

                    // determinate position
                    self.positionConfiguration(configuration);

                    configuration.set("maxHeight", null);
                };


                this._addText(product, params, createConfigurationFnc, finalizeFnc, callback)
            }
            ,

            getPrintTypeColor: function(printType, appearance, startColor) {
                var color = appearance.brightness() !== "dark" ? "#000000" : "#FFFFFF";

                if (startColor) {
                    color = printType.getClosestPrintColor(startColor.toHexString());
                } else {
                    color = printType.getClosestPrintColor(color);
                }

                return color;
            },

            _addText: function(product, params, createConfigurationFnc, finalizeFnc, callback) {

                params = _.defaults({}, params, {
                    text: null,
                    fontFamily: null,
                    perspective: null, // front, back, etc...
                    view: null,
                    printArea: null,
                    printType: null,
                    font: null,
                    fontStyle: "normal",
                    fontWeight: "normal",
                    printTypeId: null,
                    fontFamilyId: null,
                    fontFamilyName: "Arial",
                    addToProduct: true,
                    isNew: true,
                    fontSize: 25,
                    printColor: null,
                    autoGrow: true
                });

                var self = this,
                    context = product.$context.$contextModel,
                    text = params.text,
                    bus = this.$.bus,
                    productType = product.$.productType,
                    printArea = params.printArea,
                    view = params.view,
                    font = null,
                    appearance = product.$.appearance,
                    printType = params.printType,
                    printTypeId = params.printTypeId,
                    printColor = params.printColor;

                if (!text) {
                    callback(new Error("No text"));
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
                    .par({
                        fontFamilies: function(cb) {
                            if (params.fontFamily) {
                                cb();
                            } else {
                                context.$.fontFamilies.fetch({
                                    fullData: true
                                }, cb);
                            }
                        },
                        productType: function(cb) {
                            productType.fetch(null, cb);
                        }
                    })
                    .seq("fontFamily", function() {
                        var fontFamily,
                            fontFamilies = this.vars['fontFamilies'];

                        if (params.font && params.fontFamily) {
                            font = params.font;
                            return params.fontFamily;
                        }

                        if (params.fontFamily) {
                            fontFamily = params.fontFamily;
                        } else if (params.fontFamilyId) {
                            var items = fontFamilies.$items;

                            for (var i = items.length; i--;) {
                                if (items[i].$.id == params.fontFamilyId) {
                                    fontFamily = items[i];
                                    break;
                                }
                            }
                        } else if (params.fontFamilyName) {
                            fontFamily = fontFamilies.find(function(fontFamily) {
                                return fontFamily.$.name === params.fontFamilyName;
                            });
                        }

                        // use first font that is not deprecated
                        fontFamily = fontFamily || fontFamilies.find(function(fontFamily) {
                                return !fontFamily.$.deprecated
                            });

                        if (!fontFamily) {
                            throw new Error("No found");
                        }

                        font = fontFamily.getFont(params.fontWeight, params.fontStyle);

                        if (!font) {
                            product.log("Font with for required style & weight not found. Fallback to default font", "warn");
                        }

                        font = font || fontFamily.getDefaultFont();

                        if (!font) {
                            throw new Error("No font in family found");
                        }

                        return fontFamily;
                    })
                    .seq("printArea", function() {

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

                        view = product.$.view || product.getDefaultView();
                        if (!printArea && view) {
                            printArea = view.getDefaultPrintArea();
                        }

                        if (!printArea) {
                            throw new Error("target PrintArea couldn't be found.");
                        }

                        if (printArea.get("restrictions.textAllowed") === false) {
                            throw new Error("text cannot be added to this print area");
                        }

                        return printArea;
                    })
                    .seq("printType", function() {
                        var fontFamily = this.vars.fontFamily;
                        var possiblePrintTypes = ProductUtil.getPossiblePrintTypesForTextOnPrintArea(fontFamily, printArea, appearance);

                        if (printType && !_.contains(possiblePrintTypes, printType)) {
                            throw new Error("PrintType not possible for text and printArea");
                        }

                        if (printTypeId) {
                            for (var i = possiblePrintTypes.length; i--;) {
                                if (possiblePrintTypes[i].$.id == printTypeId) {
                                    printType = possiblePrintTypes[i];
                                    break;
                                }
                            }
                        }

                        printType = PrintTypeEqualizer.getPreferredPrintType(product, printArea, possiblePrintTypes) || printType || possiblePrintTypes[0];

                        if (!printType) {
                            throw new Error("No printType available");
                        }

                        return printType;
                    })
                    .seq(function(cb) {
                        printType.fetch(null, cb);
                    })
                    .seq("printTypeColor", function() {
                        var color = self.getPrintTypeColor(printType, appearance, printColor);
                        if (!color) {
                            throw "No print type color";
                        }

                        return color;
                    })
                    .seq("configuration", function() {
                        return createConfigurationFnc(params, text, printType, printArea, font, this.vars.printTypeColor);
                    })
                    .seq(function(cb) {
                        var configuration = this.vars["configuration"];
                        bus.setUp(configuration);
                        configuration.init({}, cb);
                    })
                    .seq(function() {
                        finalizeFnc(this.vars.configuration, params);
                    })
                    .exec(function(err, results) {
                        if (!err && params.addToProduct) {
                            product.removeExampleConfiguration();
                            product._addConfiguration(results.configuration);
                        }
                        callback && callback(err, results.configuration);
                        params.addToProduct && self.$.bus.trigger('Application.productChanged', product);
                    });

            }
            ,

            addSpecialText: function(product, params, callback) {

                params = _.defaults({}, params, {
                    text: null,
                    perspective: null, // front, back, etc...
                    view: null,
                    printArea: null,
                    printType: null,
                    printTypeId: null,
                    font: null,
                    addToProduct: true,
                    isNew: true
                });

                var self = this,
                    text = params.text,
                    bus = this.$.bus,
                    productType = product.$.productType,
                    printArea = params.printArea,
                    view = params.view,
                    font = params.font,
                    appearance = product.$.appearance,
                    printType = params.printType,
                    printTypeId = params.printTypeId;

                if (!text) {
                    callback(new Error("No text"));
                    return;
                }

                if (!productType) {
                    callback(new Error("ProductType not set"));
                    return;
                }

                if (!font) {
                    callback(new Error("Font not set"));
                    return;
                }

                if (!appearance) {
                    callback(new Error("Appearance for product not set"));
                    return;
                }

                flow()
                    .seq("productType", function(cb) {
                        productType.fetch(null, cb);
                    })
                    .seq("printArea", function() {

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

                        view = product.$.view || product.getDefaultView();
                        if (!printArea && view) {
                            printArea = view.getDefaultPrintArea();
                        }

                        if (!printArea) {
                            throw new Error("target PrintArea couldn't be found.");
                        }

                        if (!(printArea.get("restrictions.textAllowed") === true &&
                            printArea.get("restrictions.designAllowed") === true)) {
                            throw new Error("special text cannot be added to this print area");
                        }

                        return printArea;
                    })
                    .seq("printType", function() {

                        var possiblePrintTypes = ProductUtil.getPossiblePrintTypesForSpecialText(printArea, appearance);

                        if (printType && !_.contains(possiblePrintTypes, printType)) {
                            throw new Error("PrintType not possible for text and printArea");
                        }

                        if (printTypeId) {
                            for (var i = possiblePrintTypes.length; i--;) {
                                if (possiblePrintTypes[i].$.id == printTypeId) {
                                    printType = possiblePrintTypes[i];
                                    break;
                                }
                            }
                        }

                        printType = PrintTypeEqualizer.getPreferredPrintType(product, printArea, possiblePrintTypes) || printType || possiblePrintTypes[0];

                        if (!printType) {
                            throw new Error("No printType available");
                        }

                        return printType;
                    })
                    .seq(function(cb) {
                        printType.fetch(null, cb);
                    })
                    .seq("configuration", function() {

                        var entity = product.createEntity(SpecialTextConfiguration);

                        entity.set({
                            printType: printType,
                            printArea: printArea,
                            text: text,
                            font: font
                        });

                        return entity;
                    })
                    .seq(function(cb) {
                        var configuration = this.vars["configuration"];
                        bus.setUp(configuration);
                        configuration.init({}, cb);

                        configuration.set('isNew', params.isNew);
                    })
                    .seq(function() {
                        var configuration = this.vars["configuration"];
                        // determinate position
                        self.positionConfiguration(configuration);

                        if (params.offset) {
                            configuration.set({'offset': params.offset}, PREVENT_VALIDATION_OPTIONS);
                        }
                        if (params.scale) {
                            configuration.set('scale', params.scale, PREVENT_VALIDATION_OPTIONS);
                        }
                    })
                    .exec(function(err, results) {
                        if (!err && params.addToProduct) {
                            product.removeExampleConfiguration();
                            product._addConfiguration(results.configuration);
                        }
                        callback && callback(err, results.configuration);
                        params.addToProduct && self.$.bus.trigger('Application.productChanged', product);
                    });

            }
            ,

            getPrintType: function(printArea, configuration, product) {
                var possiblePrintTypes,
                    fontFamily = null,
                    appearance = product.get('appearance');

                if (configuration instanceof SpecialTextConfiguration) {
                    possiblePrintTypes = ProductUtil.getPossiblePrintTypesForSpecialText(printArea, appearance);
                } else if (configuration instanceof TextConfiguration) {
                    fontFamily = configuration.$.textFlow.findLeaf(0).$.style.$.font.$parent;
                    possiblePrintTypes = ProductUtil.getPossiblePrintTypesForTextOnPrintArea(fontFamily, printArea, appearance);
                } else if (configuration instanceof DesignConfiguration) {
                    possiblePrintTypes = ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(configuration.$.design, printArea, appearance);
                    possiblePrintTypes = _.filter(possiblePrintTypes, function(printType) {
                        return PrintValidator.canBePrintedSinglePrintType(configuration.$.design, printType, printArea)
                    });
                } else if (configuration instanceof BendingTextConfiguration) {
                    fontFamily = configuration.$.font.getFontFamily();
                    possiblePrintTypes = ProductUtil.getPossiblePrintTypesForTextOnPrintArea(fontFamily, printArea, appearance);
                }

                var printType = PrintTypeEqualizer.getPreferredPrintType(product, printArea, possiblePrintTypes) || possiblePrintTypes[0];

                if (!printType) {
                    throw new Error("No printType available");
                }

                return printType;
            }
            ,

            _moveConfigurationToView: function(product, configuration, printType, printArea) {
                var self = this,
                    bus = this.$.bus;

                if (!printType && !printArea) {
                    printType = configuration.$.printType;
                    printArea = configuration.$.printArea;
                }

                product.$.configurations.remove(configuration);
                configuration.set({
                    rotation: 0,
                    scale: {x: 1, y: 1},
                    printType: printType,
                    printArea: printArea
                }, {silent: true});
                configuration.mainConfigurationRenderer = null;

                configuration.clearErrors();
                product._addConfiguration(configuration);
                self.positionConfiguration(configuration);
                bus.trigger('Application.productChanged', null);
            }
            ,

            moveConfigurationToView: function(product, configuration, view, callback) {

                var self = this,
                    printArea,
                    printType,
                    validations;

                view = view || product.$.view || product.getDefaultView();

                flow()
                    .seq(function() {
                        printArea = self.getPrintArea(view, product.$.productType);
                    })
                    .seq(function() {
                        printType = self.getPrintType(printArea, configuration, product);
                    })
                    .seq(function(cb) {
                        printType.fetch(null, cb);
                    })
                    .seq('validMove', function() {
                        return self.validateMove(printType, printArea, configuration, product);
                    })
                    .exec(function(err, results) {
                        if (!err) {
                            if (results.validMove) {
                                self._moveConfigurationToView(product, configuration, printType, printArea);
                                callback && callback();
                            } else {
                                self._moveConfigurationToView(product, configuration, configuration.$.printType, configuration.$.printArea);
                                callback && callback(new Error('Validation errors found. Configuration moved to old view'));
                            }
                        } else {
                            self._moveConfigurationToView(product, configuration, configuration.$.printType, configuration.$.printArea);
                            callback && callback(new Error('Something went wrong preparing the move of the configuration.'));
                        }
                    });
            }
            ,

            validateMove: function(printTypes, printArea, configuration, product) {
                if (!(printTypes instanceof Array)) {
                    printTypes = [printTypes];
                }

                if (configuration instanceof DesignConfiguration && configuration.$.design
                    && !PrintValidator.canBePrinted(configuration.$.design, product, printTypes, printArea)) {
                    return null;
                }

                var validationsForTypes = this.validateConfigurationMoveList(printTypes, printArea, configuration);
                return _.some(validationsForTypes, function(validations) {
                    return validations && _.every(validations, function(validation) {
                            return !validation;
                        });
                });
            }
            ,

            validateConfigurationMoveList: function(printTypes, printArea, configuration) {
                var ret = [];
                for (var i = 0; i < printTypes.length; i++) {
                    ret.push(this.validateConfigurationMove(printTypes[i], printArea, configuration));
                }

                return ret;
            }
            ,

            validateConfigurationMove: function(printType, printArea, configuration) {
                try {
                    var scale = this.getConfigurationPosition(configuration, printArea, printType).scale;
                    return configuration._validatePrintTypeSize(printType, configuration.get('size.width'), configuration.get('size.height'), scale);
                } catch (e) {
                    return null;
                }
            }
            ,

            getPrintArea: function(view, productType) {
                if (!view) {
                    throw new Error("No view supplied");
                }

                if (!productType.containsView(view)) {
                    throw new Error("View not on ProductType");
                }

                // TODO: look for print area that supports print types, etc...
                return view.getDefaultPrintArea();
            }
            ,

            moveConfigurationsToView: function(product, configurations, view, callback) {
                var self = this;
                flow()
                    .parEach(configurations.toArray(), function(config, cb) {
                        self.moveConfigurationToView(product, config, view, function(err, result) {
                            cb();
                        });
                    })
                    .exec(callback)
            }
            ,

            setTextForConfiguration: function(text, configuration, options) {
                if (!(configuration instanceof TextConfiguration)) {
                    throw new Error("Configuration is not a TextConfiguration");
                }

                options = options || {};

                var textFlow = TextFlow.initializeFromText(text),
                    textRange = TextRange.createTextRange(0, textFlow.textLength()),
                    firstLeaf = configuration.$.textFlow.getFirstLeaf(),
                    paragraph,
                    leafStyle,
                    paragraphStyle;

                if (firstLeaf) {
                    paragraph = firstLeaf.$parent || this.get(configuration, "textFlow.children.at(0)");
                    leafStyle = firstLeaf.$.style;
                    if (paragraph) {
                        paragraphStyle = paragraph.$.style;
                    }
                }

                leafStyle.$.fontSize = options.fontSize || leafStyle.$.fontSize;
                leafStyle.$.font = options.font || leafStyle.$.font;

                var operation = new ApplyStyleToElementOperation(textRange, textFlow, leafStyle, paragraphStyle);
                operation.doOperation();

                configuration.$.selection && configuration.$.selection.set({
                    activeIndex: 0,
                    anchorIndex: 0
                });
                configuration.set('textFlow', textFlow);
                textFlow.trigger('operationComplete', null, textFlow);
                this.$.bus.trigger('Application.productChanged', null);
            }
            ,

            clamp: function(value, min, max) {

                if (min > max) {
                    throw new Error('Min is bigger than max.');
                }

                return Math.min(Math.max(value, min), max);
            }
            ,

            centerAt: function(x, y, rect) {
                return {
                    x: x - rect.width / 2,
                    y: y - rect.height / 2
                }
            },

            positionConfiguration: function(configuration) {
                if (configuration instanceof BendingTextConfiguration) {
                    this.positionBendingTextConfiguration(configuration);
                } else {
                    configuration.set(this.getConfigurationPosition(configuration), PREVENT_VALIDATION_OPTIONS);
                }
            },

            positionBendingTextConfiguration: function(configuration) {
                var self = this;

                function closedFn () {
                    if (configuration.$._size.$.width !== 0 && configuration.$._size.$.height !== 0) {
                        configuration.unbind('sizeChanged', closedFn);
                        self.positionBendingTextConfiguration(configuration);
                    }
                }

                if (configuration.$._size.$.width === 0 || configuration.$._size.$.height === 0) {
                    configuration.bind('sizeChanged', closedFn)
                } else {
                    configuration.set(this.getConfigurationPosition(configuration), PREVENT_VALIDATION_OPTIONS);
                }
            },

            getConfigurationPosition: function(configuration, printArea, printType) {

                if (!configuration) {
                    throw new Error('No configuration argument.');
                }

                printArea = printArea || configuration.$.printArea;
                printType = printType || configuration.$.printType;

                var printAreaWidth = printArea.get("boundary.size.width"),
                    printAreaHeight = printArea.get("boundary.size.height"),
                    printTypeWidth = printType.get('size.width'),
                    printTypeHeight = printType.get('size.height'),
                    maxHeight = Math.min(printAreaHeight, printTypeHeight),
                    maxWidth = Math.min(printAreaWidth, printTypeWidth),
                    defaultBox = printArea.$.defaultBox || {
                            x: 0,
                            y: 0,
                            width: printAreaWidth,
                            height: printAreaHeight
                        },
                    boundingBox,
                    defaultBoxCenterX = defaultBox.x + defaultBox.width / 2,
                    defaultBoxCenterY = defaultBox.y + defaultBox.height / 2,
                    offset = configuration.$.offset.clone();

                boundingBox = configuration._getBoundingBox();
                var centeredOffset = this.centerAt(defaultBoxCenterX, defaultBoxCenterY, boundingBox);
                offset.set({
                    x: centeredOffset.x,
                    y: defaultBox.y
                });


                // scale to fit into default box
                var scaleToFitDefaultBox = Math.min(defaultBox.width / boundingBox.width, defaultBox.height / boundingBox.height);
                var minimumDesignScale;

                if (configuration instanceof DesignConfiguration && printType.isEnlargeable()) {
                    minimumDesignScale = (configuration.get("design.restrictions.minimumScale") || 100) / 100;
                } else if (configuration instanceof TextConfiguration && printType.isEnlargeable()) {
                    minimumDesignScale = configuration._getMinimalScale(printType);
                }

                var maxPrintTypeScale = printTypeWidth / boundingBox.width;

                if (configuration instanceof SpecialTextConfiguration || (configuration instanceof DesignConfiguration && !configuration.$.design.isVectorDesign())) {
                    maxPrintTypeScale = 1;
                }

                var scale = this.clamp(scaleToFitDefaultBox, minimumDesignScale || 0, maxPrintTypeScale);

                boundingBox = configuration._getBoundingBox(offset, null, null, null, scale);
                centeredOffset = this.centerAt(defaultBoxCenterX, defaultBoxCenterY, boundingBox);
                // position centered within defaultBox
                offset.set('x', centeredOffset.x);

                var scaleToFitWidth,
                    scaleToFitHeight;

                if (offset.$.x < 0 || offset.$.x + boundingBox.width > maxWidth) {
                    // hard boundary error
                    var maxPossibleWidthToHardBoundary = Math.min(defaultBoxCenterX, maxWidth - defaultBoxCenterX) * 2;

                    // scale to avoid hard boundary error
                    scaleToFitWidth = maxPossibleWidthToHardBoundary / boundingBox.width;
                    scale = scale * scaleToFitWidth;
                    boundingBox = configuration._getBoundingBox(offset, null, null, null, scale);
                    centeredOffset = this.centerAt(defaultBoxCenterX, defaultBoxCenterY, boundingBox);
                    // position centered within defaultBox
                    offset.set('x', centeredOffset.x);
                }

                if (boundingBox.height > maxHeight) {
                    // y-scale needed to fit print area
                    // calculate maxScale to fix height
                    scaleToFitHeight = maxHeight / boundingBox.height;

                    // TODO: try the two different scales, prefer defaultBox and fallback to printArea if size to small
                    scale = scale * scaleToFitHeight;

                    boundingBox = configuration._getBoundingBox(offset, null, null, null, scale);
                    centeredOffset = this.centerAt(defaultBoxCenterX, defaultBoxCenterY, boundingBox);
                    // position centered within defaultBox
                    offset.set(centeredOffset);
                }

                if (offset.$.y < 0 || offset.$.y + boundingBox.height > maxHeight) {
                    // hard boundary error

                    // center in print area

                    offset.set({
                        y: maxHeight / 2 - boundingBox.height / 2
                    });
                }

                // configuration.set({
                //     offset: offset
                // }, PREVENT_VALIDATION_OPTIONS);
                return {
                    offset: offset,
                    scale: {
                        x: scale,
                        y: scale
                    }
                }
            }
            ,

            convertTextToSpecialText: function(product, textConfiguration, params, callback) {
                params = params || {};
                var offset = textConfiguration.$.offset.clone();
                var width = textConfiguration.width();
                _.defaults(params, {
                    addToProduct: true,
                    removeConfiguration: true,
                    text: textConfiguration.$.textFlow.text(0, -1, "\n").replace(/\n$/, "")
                });
                var self = this;
                this.addSpecialText(product, params, function(err, config) {

                    if (err) {
                        callback && callback(err);
                    } else {
                        params.removeConfiguration && product.$.configurations.remove(textConfiguration);
                        var s = width / config.width(1);
                        config.set({
                            'scale': {
                                x: s,
                                y: s
                            }, 'offset': offset,
                            rotation: textConfiguration.$.rotation,
                            originalConfiguration: textConfiguration
                        }, {
                            force: true
                        });

                        config.set("_size", config.$._size, {force: true});
                        config.set("isNew", textConfiguration.$.isNew);
                        config.set("isTemplate", textConfiguration.$.isTemplate);

                        callback && callback(err, config);

                        self.$.bus.trigger('Application.productChanged', product);
                    }


                });
            }
            ,

            convertTextToBendingText: function(product, textConfiguration, params, callback) {
                params = params || {};
                var offset = textConfiguration.$.offset.clone();
                var width = textConfiguration.width();
                _.defaults(params, {
                    addToProduct: true,
                    removeConfiguration: true,
                    text: textConfiguration.$.textFlow.text(0, -1, "\n").replace(/\n$/, "")
                });
                var self = this;
                this.addBendingText(product, params, function(err, config) {
                    if (err) {
                        callback && callback(err);
                    } else {
                        params.removeConfiguration && product.$.configurations.remove(textConfiguration);
                        var s = width / config.width(1);
                        config.set({
                            'scale': {
                                x: s,
                                y: s
                            }, 'offset': offset,
                            rotation: textConfiguration.$.rotation,
                            originalConfiguration: textConfiguration
                        });

                        config.set("_size", config.$._size, {force: true});
                        config.set("isNew", textConfiguration.$.isNew);
                        config.set("isTemplate", textConfiguration.$.isTemplate);

                        callback && callback(err, config);

                        self.$.bus.trigger('Application.productChanged', product);
                    }

                });
            }
            ,

            convertSpecialTextToText: function(product, specialTextConfiguration, params, callback) {
                params = params || {};
                var offset = specialTextConfiguration.$.offset.clone();
                var width = specialTextConfiguration.width();
                _.defaults(params, {
                    isNew: false,
                    addToProduct: true,
                    removeConfiguration: true,
                    text: (specialTextConfiguration.$.text || "").replace(/^\n+|\n+$/gi, "")
                });
                var self = this;
                this.addText(product, params, function(err, config) {

                    if (err) {
                        callback && callback(err);
                    } else {

                        params.removeConfiguration && product.$.configurations.remove(specialTextConfiguration);
                        var s = width / config.width();
                        config.set({
                            'scale': {
                                x: s,
                                y: s
                            }, 'offset': offset,
                            rotation: specialTextConfiguration.$.rotation,
                            isNew: specialTextConfiguration.$.isNew,
                            originalConfiguration: specialTextConfiguration
                        });

                        callback && callback(err, config);

                        self.$.bus.trigger('Application.productChanged', product);
                    }
                });
            }
            ,

            convertBendingTextToText: function(product, bendingTextConfiguration, params, callback) {
                params = params || {};
                var offset = bendingTextConfiguration.$.offset.clone();
                var width = bendingTextConfiguration.width();
                _.defaults(params, {
                    isNew: false,
                    addToProduct: true,
                    removeConfiguration: true,
                    text: (bendingTextConfiguration.$.text || "").replace(/^\n+|\n+$/gi, "")
                });
                var self = this;
                this.addText(product, params, function(err, config) {

                    if (err) {
                        callback && callback(err);
                    } else {

                        params.removeConfiguration && product.$.configurations.remove(bendingTextConfiguration);
                        var s = width / config.width();
                        config.set({
                            'scale': {
                                x: s,
                                y: s
                            }, 'offset': offset,
                            rotation: bendingTextConfiguration.$.rotation,
                            isNew: bendingTextConfiguration.$.isNew,
                            originalConfiguration: bendingTextConfiguration
                        });

                        callback && callback(err, config);

                        self.$.bus.trigger('Application.productChanged', product);
                    }
                });
            }
            ,

            convertText: function(product, configuration) {
                if (configuration) {
                    var font = configuration.$.font ? configuration.$.font : configuration.getUsedFonts()[0],
                        fontFamily = font.getFontFamily();

                    if (configuration instanceof TextConfiguration) {
                        this.convertTextToBendingText(product, configuration, {
                            printColor: configuration.$.printColors.at(0),
                            font: font,
                            fontFamily: fontFamily
                        });
                    } else if (configuration instanceof BendingTextConfiguration) {
                        this.convertBendingTextToText(product, configuration, {
                            printColor: configuration.$.printColors.at(0),
                            font: font,
                            fontFamily: fontFamily
                        });
                    }
                }
            }
            ,

            checkConfigurationOffset: function(product, configuration) {

                if (this._checkConfigurationOutsideViewPort(product, configuration)) {
                    // configuration has been removed
                    return;
                }

                this._checkConfigurationOutsideSoftBoundedPrintArea(product, configuration);

            }
            ,

            _checkConfigurationOutsideSoftBoundedPrintArea: function(product, configuration) {

                if (!(product && configuration)) {
                    return;
                }

                // check if the configuration is complete outside the print area, if so remove it
                var boundingBox = configuration._getBoundingBox(),
                    printArea = configuration.$.printArea;

                if (boundingBox && printArea && printArea.hasSoftBoundary() &&
                    (
                        boundingBox.x > printArea.width() ||
                        boundingBox.x + boundingBox.width < 0 ||
                        boundingBox.y > printArea.height() ||
                        boundingBox.y + boundingBox.height < 0
                    )) {

                    product.$.configurations.remove(configuration);
                    return true;
                }

                return false;

            }
            ,

            _checkConfigurationOutsideViewPort: function(product, configuration) {

                if (!this.$.removeConfigurationOutsideViewPort) {
                    return;
                }

                if (!(configuration && product)) {
                    return;
                }

                // check if the configuration is complete outside the print area, if so remove it
                var boundingBox = configuration._getBoundingBox(),
                    printArea = configuration.$.printArea;


                if (!(printArea && boundingBox)) {
                    return;
                }

                if (printArea.hasSoftBoundary()) {
                    // don't remove for soft boundaries
                    return;
                }

                // find default view for print area
                var view;

                if (this.$.view && this.$.view.containsPrintArea(printArea)) {
                    // use current view of the product
                    view = this.$.view;
                }

                if (!view) {
                    // use the default view
                    view = printArea.getDefaultView();
                }

                if (!view) {
                    return;
                }

                var viewMap = view.getViewMapForPrintArea(printArea);

                if (!viewMap) {
                    return;
                }

                var right = view.get("size.width"),
                    bottom = view.get("size.height"),
                    middlePoint = {
                        x: boundingBox.x + boundingBox.width / 2 + viewMap.get("offset.x"),
                        y: boundingBox.y + boundingBox.height / 2 + viewMap.get("offset.y")
                    };

                if (middlePoint.x < 0 || middlePoint.y < 0 || middlePoint.x > right || middlePoint.y > bottom) {
                    // outside the view
                    //product.$.configurations.remove(configuration);
                    this._moveConfigurationToView(product, configuration);
                    return true;
                }

                return false;

            }


        });

    })
;