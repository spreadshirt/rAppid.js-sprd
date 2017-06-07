define(["sprd/manager/IProductManager", "underscore", "flow", "sprd/util/ProductUtil", "sprd/util/ArrayUtil", 'text/entity/TextFlow', 'sprd/type/Style', 'sprd/entity/DesignConfiguration', 'sprd/entity/TextConfiguration', 'sprd/entity/SpecialTextConfiguration', 'text/operation/ApplyStyleToElementOperation', 'text/entity/TextRange', 'sprd/util/UnitUtil', 'js/core/Bus', 'sprd/manager/PrintTypeEqualizer', "sprd/entity/BendingTextConfiguration", "sprd/entity/Scale", "js/core/List", "sprd/util/PrintValidator", "sprd/type/Vector", "js/type/Color"],
    function(IProductManager, _, flow, ProductUtil, ArrayUtil, TextFlow, Style, DesignConfiguration, TextConfiguration, SpecialTextConfiguration, ApplyStyleToElementOperation, TextRange, UnitUtil, Bus, PrintTypeEqualizer, BendingTextConfiguration, Scale, List, PrintValidator, Vector, Color) {


        var PREVENT_VALIDATION_OPTIONS = {
            preventValidation: true
        };
        // factor * print area height = font size
        var INITIAL_FONT_SIZE_SCALE_FACTOR = 0.07;
        var COLOR_CONVERSION_THRESHOLD = 35;

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
            setProductType: function(product, productType, appearance, options, callback) {
                if (options instanceof Function) {
                    callback = options;
                    options = null;
                } else if (appearance instanceof Function) {
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
                    .seq('removedConfigurations', function() {
                        options = options || {};
                        options.allowPrintAreaChange = true;
                        options.respectTransform = true;
                        return self.convertConfigurations(product, productType, appearance, options);
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

            setAppearance: function(product, appearance, options) {
                options = options || {};
                if (product.$.appearance.$.id === appearance.$.id) {
                    // same appearance, nothing to do
                    return;
                }

                options.respectTransform = true;
                var removedConfigurations = this.convertConfigurations(product, product.$.productType, appearance, options);
                product.set({
                    appearance: appearance
                });
                this.$.bus && this.$.bus.trigger('Application.productChanged', product);

                return removedConfigurations;
            },

            /***
             * Converts the configurations of a product with the given productType and appearance
             * @param {sprd.model.Product} product
             * @param {sprd.model.ProductType} productType
             * @param {sprd.entity.Appearance} appearance
             */
            convertConfigurations: function(product, productType, appearance, options) {
                options = options || {};

                var self = this;
                var removedConfigurations = _.filter(_.clone(product.$.configurations.$items), function(configuration) {
                    return !self.convertConfiguration(product, configuration, productType, appearance, options);
                });

                if (removedConfigurations && removedConfigurations.length) {
                    self.trigger('on:removedConfigurations', {configurations: removedConfigurations}, self);
                    product.$.configurations.remove(removedConfigurations);
                }

                return removedConfigurations;
            },

            getFirstDigital: function(possiblePrintTypes) {
                return _.find(possiblePrintTypes, function(printType) {
                    return !printType.isPrintColorColorSpace();
                });
            },

            addConfiguration: function(product, configuration, options) {
                return this.convertConfiguration(product, configuration, product.$.productType, product.$.appearance, options);
            },

            /***
             * Converts a configuration of a product with the given productType and appearance
             * @param {sprd.model.Product} product
             * @param {sprd.model.Configuration} configuration
             * @param {sprd.model.ProductType} productType
             * @param {sprd.entity.Appearance} appearance
             * @param {Object} options
             * @returns {Boolean} If the conversion was successful
             */
            convertConfiguration: function(product, configuration, productType, appearance, options) {
                options = options || {};
                var self = this;
                var closestView = options.toCurrentView ? product.$.view : productType.getViewByConfiguration(configuration);
                var closestPrintArea = (closestView ? closestView.getDefaultPrintArea() : null) || productType.getDefaultPrintArea();
                var printAreas = ArrayUtil.move(productType.$.printAreas.$items, closestPrintArea, 0);

                var possiblePrintTypes = configuration.getPossiblePrintTypesForPrintArea(closestPrintArea, appearance);

                var targetPrintArea = closestPrintArea;
                if ((!possiblePrintTypes || !possiblePrintTypes.length) && options.allowPrintAreaChange) {
                    targetPrintArea = configuration.getPreferredPrintArea(printAreas, appearance);
                }

                if (targetPrintArea) {
                    possiblePrintTypes = configuration.getPossiblePrintTypesForPrintArea(targetPrintArea, appearance);

                    if (!possiblePrintTypes || !possiblePrintTypes.length) {
                        return false;
                    }

                    ArrayUtil.move(possiblePrintTypes, configuration.$.printType, 0);

                    var validatedMove = self.validateMove(possiblePrintTypes, targetPrintArea, configuration, product, options);
                    if (!validatedMove && options.preventValidations) {
                        validatedMove = {printType: possiblePrintTypes[0]};
                    }

                    if (validatedMove) {
                        options.transform = validatedMove.transform;
                        self._addConfiguration(product, configuration, validatedMove.printType, targetPrintArea, options);
                        configuration.$.printColors.each(function(printColor, index) {
                            configuration.setColor(index, validatedMove.printType.getClosestPrintColor(self.convertColor(appearance, printColor.color())));
                        });
                        return true;
                    }
                }

                return false;
            },

            getTargetPrintArea: function(product, params) {
                var view = params.view,
                    printArea = params.printArea,
                    perspective = params.perspective,
                    productType = product.$.productType;

                if (!printArea && perspective && !view) {
                    view = productType.getViewByPerspective(perspective);
                }

                if (!printArea && view) {
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

                return printArea;
            },

            getPrintTypesForDesign: function(product, design, printArea, printType, appearance) {
                appearance = appearance || product.$.appearance;
                var possiblePrintTypes = ProductUtil.getPossiblePrintTypesForDesignOnPrintArea(design, printArea, appearance);

                if (printType && !_.contains(possiblePrintTypes, printType)) {
                    throw new Error("PrintType not possible for design and printArea");
                }

                printType = PrintTypeEqualizer.getPreferredPrintType(product, printArea, possiblePrintTypes) || printType || possiblePrintTypes[0];

                if (!printType) {
                    throw new Error("No printType available");
                }

                return ArrayUtil.move(possiblePrintTypes, printType, 0);
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
                    .par(function(cb) {
                        design.fetch(null, cb);
                    }, function(cb) {
                        productType.fetch(null, cb);
                    })
                    .seq("printArea", function() {
                        var printArea = self.getTargetPrintArea(product, params);
                        if (!printArea.get("restrictions.designAllowed")) {
                            throw new Error("designs cannot be added to this print area");
                        }

                        return printArea;
                    })
                    .seq("printTypes", function() {
                        var printTypes = self.getPrintTypesForDesign(product, design, this.vars.printArea, printType);
                        printType = printTypes[0];
                        return printTypes;
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
                    .seq('validatedMove', function() {
                        return self.validateMove(this.vars.printTypes, this.vars.printArea, this.vars.designConfiguration, product);
                    })
                    .seq(function(cb) {
                        if (!this.vars.validatedMove) {
                            return cb();
                        }
                        this.vars.validatedMove.printType.fetch(null, cb);
                    })
                    .exec(function(err, results) {
                        if (!err && results.validatedMove) {
                            self._addConfiguration(product, results.designConfiguration, results.validatedMove.printType, results.printArea, {transform: results.validatedMove.transform});
                        }
                        callback && callback(err, results.designConfiguration);
                    });

            },

            validateAndAdd: function(product, configuration, printTypes, printArea, options) {
                var validatedMove = this.validateMove(printTypes, printArea, configuration, product, options);

                if (!validatedMove) {
                    validatedMove = {printType: printTypes[0]};
                }

                if (validatedMove) {
                    options = options || {};
                    options.transform = validatedMove.transform;
                    this._addConfiguration(product, configuration, validatedMove.printType, printArea, options);
                }
            },

            addText: function(product, params, callback) {

                var self = this;

                var finalizeFnc = function(configuration, printTypes, params) {

                    configuration.$.selection.set({
                        activeIndex: configuration.$.textFlow.textLength() - 1,
                        anchorIndex: 0
                    });

                    configuration.set('isNew', params.isNew);
                    configuration.set('isTemplate', params.isTemplate);


                    configuration.set("maxHeight", 1);

                    params.addToProduct && self.validateAndAdd(product, configuration, printTypes);

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
                        autoGrow: params.autoGrow,
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
                        printColors: printColors,
                        angle: params.angle,
                        _size: params.size,
                        offset: params.offset
                    });

                    return entity;
                };

                var finalizeFnc = function(configuration, printTypes, params) {

                    configuration.set('isNew', params.isNew);
                    configuration.set('isTemplate', params.isTemplate);

                    configuration.set("maxHeight", 1);

                    printTypes = configuration.getPossiblePrintTypes(product.$.appearance);
                    // determinate position
                    params.addToProduct && self.validateAndAdd(product, configuration, printTypes, null, {respectTransform: true});

                    configuration.set("maxHeight", null);
                };


                this._addText(product, params, createConfigurationFnc, finalizeFnc, callback)
            },

            getPrintTypeColor: function(printType, appearance, startColor) {
                var color = appearance.brightness() !== "dark" ? "#000000" : "#FFFFFF";

                if (startColor) {
                    color = printType.getClosestPrintColor(startColor.toHexString());
                } else {
                    color = printType.getClosestPrintColor(color);
                }

                return color;
            },

            convertColor: function(appearance, oldColor) {
                var appearanceColors = appearance.get('colors'),
                    singleColorAppearance = appearanceColors.length == 1;

                if (!singleColorAppearance) {
                    return oldColor;
                }

                var appearanceColor = appearanceColors.at(0),
                    distance = oldColor.distanceTo(appearanceColor.color()),
                    newColor = oldColor;

                if (distance < COLOR_CONVERSION_THRESHOLD) {
                    newColor = oldColor.invert();
                }

                return newColor;
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
                    isTemplate: false,
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
                    font = null,
                    appearance = product.$.appearance,
                    printType = params.printType,
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
                        printArea = self.getTargetPrintArea(product, params);

                        if (printArea.get("restrictions.textAllowed") === false) {
                            throw new Error("text cannot be added to this print area");
                        }

                        return printArea;
                    })
                    .seq("printTypes", function() {
                        var fontFamily = this.vars.fontFamily;
                        var possiblePrintTypes = ProductUtil.getPossiblePrintTypesForTextOnPrintArea(fontFamily, printArea, appearance);
                        printType = possiblePrintTypes[0];
                        return possiblePrintTypes;
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
                        finalizeFnc(this.vars.configuration, this.vars.printTypes, params);
                    })
                    .exec(function(err, results) {
                        callback && callback(err, results.configuration);
                        params.addToProduct && self.$.bus.trigger('Application.productChanged', product);
                    });

            },

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
                    isNew: true,
                    isTemplate: false
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
                        configuration.set('isTemplate', params.isTemplate);
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

            },

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
            },

            _addConfiguration: function(product, configuration, printType, printArea, options) {
                var self = this,
                    bus = this.$.bus;

                this._moveConfiguration(product, configuration, printType, printArea, options);
                if (!product.$.configurations.contains(configuration)) {
                    product.removeExampleConfiguration();
                    product._addConfiguration(configuration);
                }
                configuration.clearErrors();
                bus.trigger('Application.productChanged', null);
            },

            _moveConfiguration: function(product, configuration, printType, printArea, options) {
                var self = this,
                    bus = this.$.bus;

                options = options || {};
                printType = printType || configuration.$.printType;
                printArea = printArea || configuration.$.printArea;

                if (!options.respectTransform) {
                    if (!options.respectScale) {
                        configuration.set('scale', {x: 1, y: 1}, {silent: true});
                    }

                    if (!options.respectRotation) {
                        configuration.set('rotation', 0, {silent: true});
                    }
                }

                configuration.set({
                    printType: printType,
                    printArea: printArea
                }, {
                    //silent: true,
                    printTypeTransformed: true
                });

                //configuration.mainConfigurationRenderer = null;
                self.positionConfiguration(configuration, printArea, printType, options);
            },

            moveConfigurationToView: function(product, configuration, view, options, callback) {

                var self = this,
                    printArea,
                    printType;

                if (_.isFunction(options) && !callback) {
                    callback = options;
                    options = null;
                }

                options = options || {};
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
                    .seq('validatedMove', function() {
                        return self.validateMove(printType, printArea, configuration, product, options);
                    })
                    .exec(function(err, results) {
                        if (!err) {
                            if (results.validatedMove) {
                                options.transform = results.validatedMove.transform;
                                self._addConfiguration(product, configuration, printType, printArea, options);
                                callback && callback();
                            } else {
                                self._addConfiguration(product, configuration, configuration.$.printType, configuration.$.printArea, options);
                                callback && callback(new Error('Validation errors found. Configuration moved to old view'));
                            }
                        } else {
                            self._addConfiguration(product, configuration, configuration.$.printType, configuration.$.printArea, options);
                            callback && callback(new Error('Something went wrong preparing the move of the configuration.'));
                        }
                    });
            },


            validateMove: function(printTypes, printArea, configuration, product, options) {
                if (!(printTypes instanceof Array)) {
                    printTypes = [printTypes];
                }

                if (configuration instanceof DesignConfiguration && configuration.$.design
                    && !PrintValidator.canBePrinted(configuration.$.design, product, printTypes, printArea)) {
                    return null;
                }

                ArrayUtil.move(printTypes, PrintTypeEqualizer.getPreferredPrintType(product, printArea, printTypes), 0);

                var validatedMove = null,
                    self = this;
                _.find(printTypes, function(printType) {
                    validatedMove = self.validateConfigurationMove(printType, printArea, configuration, options);
                    return validatedMove && _.every(validatedMove.validations, function(validation) {
                            return !validation;
                        });
                });

                return validatedMove;
            },

            validateConfigurationMove: function(printType, printArea, configuration, options) {
                try {
                    var transform = this.getConfigurationPosition(configuration, printArea, printType, options);
                    var validations = configuration._validatePrintTypeSize(printType, configuration.width(transform.scale.x), configuration.height(transform.scale.y), transform.scale);
                    return {
                        printType: printType,
                        validations: validations,
                        transform: transform
                    }
                } catch (e) {
                    return null;
                }
            },

            getPrintArea: function(view, productType) {
                if (!view) {
                    throw new Error("No view supplied");
                }

                if (!productType.containsView(view)) {
                    throw new Error("View not on ProductType");
                }

                // TODO: look for print area that supports print types, etc...
                return view.getDefaultPrintArea();
            },

            moveConfigurationsToView: function(product, configurations, view, options, callback) {
                var self = this;

                if (_.isFunction(options) && !callback) {
                    callback = options;
                    options = null;
                }

                flow()
                    .parEach(configurations.toArray(), function(config, cb) {
                        self.moveConfigurationToView(product, config, view, options, function(err, result) {
                            cb();
                        });
                    })
                    .exec(callback)
            },

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
            },

            clamp: function(value, min, max) {

                if (min > max) {
                    throw new Error('Min is bigger than max.');
                }

                return Math.min(Math.max(value, min), max);
            },

            centerAtPoint: function(point, rect) {
                return this.centerAt(point.x, point.y, rect);
            },

            centerAt: function(x, y, rect) {
                return {
                    x: x - rect.width / 2,
                    y: y - rect.height / 2
                }
            },

            positionConfiguration: function(configuration, printArea, printType, options) {
                options = options || {};

                if (configuration instanceof BendingTextConfiguration) {
                    this.positionBendingTextConfiguration(configuration, printArea, printType, options);
                } else {
                    var transform = options.transform || this.getConfigurationPosition(configuration, printArea, printType, options);
                    configuration.set(transform, PREVENT_VALIDATION_OPTIONS);
                }
            },

            positionBendingTextConfiguration: function(configuration, printArea, printType, options) {
                var self = this;

                function closedFn () {
                    if (configuration.$._size.$.width !== 0 && configuration.$._size.$.height !== 0) {
                        configuration.unbind('sizeChanged', closedFn);
                        self.positionBendingTextConfiguration(configuration, printArea, printType, options);
                    }
                }

                if (configuration.$._size.$.width === 0 || configuration.$._size.$.height === 0) {
                    configuration.bind('sizeChanged', closedFn)
                } else {
                    configuration.set(this.getConfigurationPosition(configuration, printArea, printType, options), PREVENT_VALIDATION_OPTIONS);
                }
            },

            getConfigurationCenterAsRatio: function(configuration) {
                return this.getPointAsRatio(configuration.center(), configuration.$.printArea);
            },

            getOffsetAsRatio: function(offset, printArea) {
                return this.getPointAsRatio(offset.$, printArea);
            },

            getPointAsRatio: function(point, printArea) {
                return {
                    x: point.x / printArea.get("boundary.size.width"),
                    y: point.y / printArea.get("boundary.size.height")
                }
            },

            getVectorAsRatio: function(vector, printArea) {
                return this.getPointAsRatio(vector.getAsPoint(), printArea);
            },

            getRatioAsPoint: function(ratioPoint, printArea) {
                return {
                    x: ratioPoint.x * printArea.get("boundary.size.width"),
                    y: ratioPoint.y * printArea.get("boundary.size.height")
                }
            },

            floor: function(num, digits) {
                var factor = Math.pow(10, digits);
                return Math.floor(num * factor) / factor;
            },

            getConfigurationPosition: function(configuration, printArea, printType, options) {

                if (!configuration) {
                    throw new Error('No configuration argument.');
                }

                options = options || {};
                printArea = printArea || configuration.$.printArea;
                printType = printType || configuration.$.printType;

                var printAreaWidth = printArea.get("boundary.size.width"),
                    printAreaHeight = printArea.get("boundary.size.height"),
                    printTypeWidth = printType.get('size.width'),
                    printTypeHeight = printType.get('size.height'),
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

                // Print type is used in configuration.size() for designConfigurations
                // So to get the right boundingboxes the parameter printType needs to be used in the size
                var oldPrintType = configuration.$.printType;
                configuration.set('printType', printType, {silent: true});

                boundingBox = configuration._getRotatedBoundingBox();
                //TODO: if quotient of widths is unequal to quotient of heights, then switching between 2 print areas can make the configuration smaller and smaller
                //example: between product type 812 and 1052
                var printAreaRatio = Math.min(printAreaWidth / configuration.get('printArea.boundary.size.width'), printAreaHeight / configuration.get('printArea.boundary.size.height'));
                var scaleToFitDefaultBox = Math.min(defaultBox.width / boundingBox.width, defaultBox.height / boundingBox.height);
                var desiredScaleFactor = options.respectTransform || options.respectScale ? printAreaRatio : scaleToFitDefaultBox;
                var desiredScale = configuration.$.scale.x * desiredScaleFactor;

                var defaultDesiredOffset = Vector.create(defaultBoxCenterX, defaultBoxCenterY);
                var desiredRatio = options.respectTransform ? this.getConfigurationCenterAsRatio(configuration) : this.getVectorAsRatio(defaultDesiredOffset, printArea);
                boundingBox = configuration._getRotatedBoundingBox(null, null, null, null, desiredScale);
                var desiredOffset = this.centerAtPoint(this.getRatioAsPoint(desiredRatio, printArea), boundingBox);
                offset.set({
                    x: desiredOffset.x,
                    y: options.respectTransform ? desiredOffset.y : defaultBox.y
                });


                var minimumDesignScale;
                if (configuration instanceof DesignConfiguration && printType.isEnlargeable()) {
                    minimumDesignScale = (configuration.get("design.restrictions.minimumScale") || 100) / 100;
                } else if (configuration instanceof TextConfiguration && printType.isEnlargeable()) {
                    minimumDesignScale = configuration._getMinimalScale(printType);
                }

                // flooring after 3rd digit,
                // because configuration._getBoundingBox with maxPrintTypeScale plucked in would give width > printTypeWidth
                // the difference being smaller than 10^-8.
                var maxPrintTypeScale = this.floor(desiredScale * Math.min(printTypeWidth / boundingBox.width, printTypeHeight / boundingBox.height), 3);

                if (configuration instanceof SpecialTextConfiguration || (configuration instanceof DesignConfiguration && !configuration.$.design.isVectorDesign())) {
                    maxPrintTypeScale = 1;
                }

                //TODO: (fix) bending -> scale gets NaN
                var scale = this.clamp(desiredScale, minimumDesignScale || 0, maxPrintTypeScale);
                boundingBox = configuration._getRotatedBoundingBox(offset, null, null, null, scale);
                desiredOffset = this.centerAtPoint(this.getRatioAsPoint(desiredRatio, printArea), boundingBox);
                offset.set("x", desiredOffset.x);


                if (boundingBox.width > printAreaWidth) {
                    var scaleToFitWidth = printAreaWidth / boundingBox.width;
                    scale = scale * scaleToFitWidth;
                    boundingBox = configuration._getRotatedBoundingBox(offset, null, null, null, scale);
                    desiredOffset = this.centerAtPoint(this.getRatioAsPoint(desiredRatio, printArea), boundingBox);
                    offset.set("x", desiredOffset.x);
                }

                if (boundingBox.height > printAreaHeight) {
                    var scaleToFitHeight = printAreaHeight / boundingBox.height;
                    scale = scale * scaleToFitHeight;
                    boundingBox = configuration._getRotatedBoundingBox(offset, null, null, null, scale);
                    desiredOffset = this.centerAtPoint(this.getRatioAsPoint(desiredRatio, printArea), boundingBox);
                    offset.set("x", desiredOffset.x);
                }

                configuration.set('printType', oldPrintType, {silent: true});
                if (_.isNaN(scale) || _.isNaN(offset.$.y) || _.isNaN(offset.$.x)) {
                    throw Error('Part of the transform is not a number');
                }


                return {
                    offset: offset,
                    scale: {
                        x: scale,
                        y: scale
                    }
                }
            },

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
            },

            convertTextToBendingText: function(product, textConfiguration, params, callback) {
                params = params || {};

                _.defaults(params, {
                    addToProduct: true,
                    removeConfiguration: true,
                    text: textConfiguration.$.textFlow.text(0, -1, "\n").replace(/\n/g, " ").trim()
                });

                product.$.configurations.remove(textConfiguration);

                var self = this;
                this.addBendingText(product, params, function(err, config) {
                    if (err) {
                        callback && callback(err);
                    } else {
                        !params.removeConfiguration && product.$.configurations.add(textConfiguration);
                        config.set({
                            rotation: textConfiguration.$.rotation,
                            originalConfiguration: textConfiguration
                        });

                        config.set("isNew", textConfiguration.$.isNew);
                        config.set("isTemplate", textConfiguration.$.isTemplate);

                        callback && callback(err, config);

                        self.$.bus.trigger('Application.productChanged', product);
                    }

                });
            },

            convertSpecialTextToText: function(product, specialTextConfiguration, params, callback) {
                params = params || {};
                var offset = specialTextConfiguration.$.offset.clone();
                var width = specialTextConfiguration.width();
                _.defaults(params, {
                    isNew: false,
                    isTemplate: false,
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
                        var s = width / config.width(1);
                        config.set({
                            'scale': {
                                x: s,
                                y: s
                            }, 'offset': offset,
                            rotation: specialTextConfiguration.$.rotation,
                            isNew: specialTextConfiguration.$.isNew,
                            isTemplate: specialTextConfiguration.$.isTemplate,
                            originalConfiguration: specialTextConfiguration
                        });

                        callback && callback(err, config);

                        self.$.bus.trigger('Application.productChanged', product);
                    }
                });
            },

            convertBendingTextToText: function(product, bendingTextConfiguration, params, callback) {
                params = params || {};
                var offset = bendingTextConfiguration.$.offset.clone();
                var width = bendingTextConfiguration.width();
                _.defaults(params, {
                    isNew: false,
                    isTemplate: true,
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
                        var s = width / config.width(1);
                        config.set({
                            'scale': {
                                x: s,
                                y: s
                            }, 'offset': offset,
                            rotation: bendingTextConfiguration.$.rotation,
                            isNew: bendingTextConfiguration.$.isNew,
                            isTemplate: bendingTextConfiguration.$.isTemplate,
                            originalConfiguration: bendingTextConfiguration
                        });

                        callback && callback(err, config);

                        self.$.bus.trigger('Application.productChanged', product);
                    }
                });
            },

            convertText: function(product, configuration, angle) {
                if (configuration) {
                    var font = configuration.$.font ? configuration.$.font : configuration.getUsedFonts()[0],
                        fontFamily = font.getFontFamily();

                    if (configuration instanceof TextConfiguration) {
                        this.convertTextToBendingText(product, configuration, {
                            printColor: configuration.$.printColors.at(0),
                            font: font,
                            fontFamily: fontFamily,
                            angle: angle,
                            size: configuration.size(),
                            offset: configuration.$.offset
                        });
                    } else if (configuration instanceof BendingTextConfiguration) {
                        this.convertBendingTextToText(product, configuration, {
                            printColor: configuration.$.printColors.at(0),
                            font: font,
                            fontFamily: fontFamily
                        });
                    }
                }
            },

            checkConfigurationOffset: function(product, configuration) {

                if (this._checkConfigurationOutsideViewPort(product, configuration)) {
                    // configuration has been removed
                    return;
                }

                this._checkConfigurationOutsideSoftBoundedPrintArea(product, configuration);

            },

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

            },

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
                    this._addConfiguration(product, configuration, configuration.$.printType, configuration.$.printArea, {
                        respectScale: true,
                        respectRotation: true
                    });
                    return true;
                }

                return false;

            }


        });

    })
;