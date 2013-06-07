define(["sprd/manager/IProductManager", "underscore", "flow", "sprd/util/ProductUtil", 'text/entity/TextFlow', 'sprd/type/Style', 'sprd/entity/DesignConfiguration', 'sprd/entity/TextConfiguration', 'text/operation/ApplyStyleToElementOperation', 'text/entity/TextRange', 'sprd/util/UnitUtil', 'js/core/Bus'],
    function (IProductManager, _, flow, ProductUtil, TextFlow, Style, DesignConfiguration, TextConfiguration, ApplyStyleToElementOperation, TextRange, UnitUtil, Bus) {


        return IProductManager.inherit("sprd.manager.ProductManager", {

            inject: {
                bus: Bus
            },

            /***
             * set the product type and converts all configurations
             *
             * @param {sprd.model.Product} product
             * @param {sprd.model.ProductType} productType
             * @param {sprd.entity.Appearance} appearance
             * @param callback
             */
            setProductType: function (product, productType, appearance, callback) {
                if (appearance instanceof Function) {
                    callback = appearance;
                    appearance = null;
                }
                var self = this,
                    view;

                flow()
                    .seq(function (cb) {
                        productType.fetch(null, cb);
                    })
                    .seq(function () {
                        if (!appearance) {
                            if (product.$.appearance) {
                                appearance = productType.getClosestAppearance(product.$.appearance.getMainColor());
                            } else {
                                appearance = productType.getDefaultAppearance();
                            }
                        }
                    })
                    .seq(function () {
                        // determinate closest view for new product type
                        var currentView = product.$.view;

                        if (currentView) {
                            view = productType.getViewByPerspective(currentView.$.perspective);
                        }

                        if (!view) {
                            view = productType.getDefaultView();
                        }

                    })
                    .seq(function () {
                        self.convertConfigurations(product, productType, appearance);
                    })
                    .seq(function () {
                        // first set product type
                        // and then the appearance, because appearance depends on product type
                        product.set({
                            productType: productType,
                            view: view,
                            appearance: appearance
                        });
                    })
                    .exec(callback);

            },

            setAppearance: function (product, appearance) {
                this.convertConfigurations(product, product.$.productType, appearance);
                product.set({
                    appearance: appearance
                });
            },

            /***
             * Converts the configurations of a product with the given productType and appearance
             * @param {sprd.model.Product} product
             * @param {sprd.model.ProductType} productType
             * @param {sprd.entity.Appearance} appearance
             */
            convertConfigurations: function (product, productType, appearance) {
                var configurations = product.$.configurations.$items,
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

                    if (targetPrintArea && configuration.isAllowedOnPrintArea(targetPrintArea)) {
                        configuration.set('printArea', targetPrintArea);

                        var currentPrintAreaWidth = currentPrintArea.get("boundary.size.width");
                        var currentPrintAreaHeight = currentPrintArea.get("boundary.size.height");
                        var targetPrintAreaWidth = targetPrintArea.get("boundary.size.width");
                        var targetPrintAreaHeight = targetPrintArea.get("boundary.size.height");

                        var preferredPrintType = null;
                        var preferredScale;
                        var preferredOffset;

                        var currentConfigurationWidth = configuration.width();
                        var currentConfigurationHeight = configuration.height();

                        // find new print type
                        var possiblePrintTypes = configuration.getPossiblePrintTypesForPrintArea(targetPrintArea, appearance.$.id);
                        var printType = configuration.$.printType;

                        var center = {
                            x: configuration.$.offset.$.x + currentConfigurationWidth / 2,
                            y: configuration.$.offset.$.y + currentConfigurationHeight / 2
                        };

                        if (printType && !_.contains(possiblePrintTypes, printType)) {
                            // print type not possible any more
                            printType = null;
                        }

                        if (printType) {
                            var index = _.indexOf(possiblePrintTypes, printType);
                            if (index >= 0) {
                                // remove print type from original position
                                possiblePrintTypes.splice(index, 1);
                            }

                            // and add it to first position
                            possiblePrintTypes.unshift(printType);
                        }

                        var optimalScale = Math.min(
                            targetPrintAreaWidth / currentPrintAreaWidth,
                            targetPrintAreaHeight / currentPrintAreaHeight
                        ) * Math.abs(configuration.$.scale.x);

                        var allowScale = configuration.allowScale();

                        for (var j = 0; j < possiblePrintTypes.length; j++) {
                            printType = possiblePrintTypes[j];

                            var factor = optimalScale;
                            var minimumScale = optimalScale;

                            if (printType.isEnlargeable()) {
                                minimumScale = configuration.minimumScale();
                            }

                            var configurationPrintTypeSize = configuration.getSizeForPrintType(printType);

                            var maximumScale = Math.min(
                                printType.get("size.width") / configurationPrintTypeSize.$.width,
                                printType.get("size.height") / configurationPrintTypeSize.$.height);

                            if (!allowScale && (maximumScale < 1 || minimumScale > 1)) {
                                continue;
                            }
                            if (minimumScale > maximumScale) {
                                continue;
                            }

                            factor = Math.max(factor, minimumScale);
                            factor = Math.min(factor, maximumScale);

                            preferredScale = {
                                x: factor,
                                y: factor
                            };

                            preferredPrintType = printType;
                            break;
                        }

                        if (preferredPrintType) {

                            configuration.set({
                                printType: preferredPrintType,
                                scale: preferredScale
                            });

                            preferredOffset = {
                                x: targetPrintAreaWidth * center.x / currentPrintAreaWidth - configuration.width() / 2,
                                y: targetPrintAreaHeight * center.y / currentPrintAreaHeight - configuration.height() / 2
                            };

                            configuration.$.offset.set(preferredOffset);

                        } else {
                            // remove configuration
                            removeConfigurations.push(configuration);
                        }

                    } else {
                        // no print area found, remove configuration
                        removeConfigurations.push(configuration);
                    }
                }

                product.$.configurations.remove(removeConfigurations);
            },
            /**
             * Adds a design to a given Product
             * @param {sprd.model.Product} product
             * @param {Object} params
             * @param {Function} callback
             */
            addDesign: function (product, params, callback) {
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
                    .seq("printType", function () {
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
                    .seq(function (cb) {
                        printType.fetch(null, cb);
                    })
                    .seq("designConfiguration", function () {
                        var entity = product.createEntity(DesignConfiguration);
                        entity.set({
                            printType: printType,
                            printArea: printArea,
                            design: design,
                            designColorIds: params.designColorIds,
                            designColorRGBs: params.designColorRGBs
                        });
                        return entity;
                    })
                    .seq(function (cb) {
                        var designConfiguration = this.vars["designConfiguration"];
                        bus.setUp(designConfiguration);
                        designConfiguration.init(cb);
                    })
                    .seq(function () {
                        // determinate position
                        self._positionConfiguration(this.vars["designConfiguration"]);
                    })
                    .exec(function (err, results) {
                        !err && product._addConfiguration(results.designConfiguration);
                        callback && callback(err, results.designConfiguration);
                    });

            },

            addText: function (product, params, callback) {

                params = _.defaults({}, params, {
                    text: null,
                    fontFamily: null,
                    perspective: null, // front, back, etc...
                    view: null,
                    printArea: null,
                    printType: null,
                    fontStyle: "normal",
                    fontWeight: "normal"
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
                    printType = params.printType;

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
                        fontFamilies: function (cb) {
                            if (params.fontFamily) {
                                cb();
                            } else {
                                context.$.fontFamilies.fetch({
                                    fullData: true
                                }, cb);
                            }
                        },
                        productType: function (cb) {
                            productType.fetch(null, cb);
                        }
                    })
                    .seq("fontFamily", function () {
                        var fontFamily = params.fontFamily || this.vars["fontFamilies"].at(0);
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
                    .seq("printType", function () {
                        var fontFamily = this.vars.fontFamily;
                        var possiblePrintTypes = ProductUtil.getPossiblePrintTypesForTextOnPrintArea(fontFamily, printArea, appearance.$.id);

                        if (printType && !_.contains(possiblePrintTypes, printType)) {
                            throw new Error("PrintType not possible for text and printArea");
                        }

                        printType = printType || possiblePrintTypes[0];

                        if (!printType) {
                            throw new Error("No printType available");
                        }

                        return printType;
                    })
                    .seq(function (cb) {
                        printType.fetch(null, cb);
                    })
                    .seq("printTypeColor", function () {
                        var color = product.appearanceBrightness() !== "dark" ? "#000000" : "#FFFFFF";
                        color = printType.getClosestPrintColor(color);

                        if (!color) {
                            throw "No print type color";
                        }

                        return color;
                    })
                    .seq("configuration", function () {

                        var textFlow = TextFlow.initializeFromText(text);

                        var fontSize = this.vars.printArea.get("size.width") * 25 / 550;


                        (new ApplyStyleToElementOperation(TextRange.createTextRange(0, textFlow.textLength()), textFlow, new Style({
                            font: font,
                            fontSize: 25,
                            lineHeight: 1.2,
                            printTypeColor: this.vars["printTypeColor"]
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
                    })
                    .seq(function (cb) {
                        var configuration = this.vars["configuration"];
                        bus.setUp(configuration);
                        configuration.init(cb);
                    })
                    .seq(function () {
                        var configuration = this.vars["configuration"];
                        configuration.$.selection.set({
                            activeIndex: configuration.$.textFlow.textLength() - 1,
                            anchorIndex: 0
                        });
                        // determinate position
                        self._positionConfiguration(configuration);
                    })
                    .exec(function (err, results) {
                        !err && product._addConfiguration(results.configuration);
                        callback && callback(err, results.configuration);
                    });

            },

            setTextForConfiguration: function (text, configuration) {
                if (!(configuration instanceof TextConfiguration)) {
                    throw new Error("Configuration is not a TextConfiguration");
                }

                var textFlow = TextFlow.initializeFromText(text),
                    textRange = TextRange.createTextRange(0, textFlow.textLength()),
                    firstLeaf = configuration.$.textFlow.getFirstLeaf(),
                    paragraph,
                    leafStyle,
                    paragraphStyle;

                if (firstLeaf) {
                    paragraph = firstLeaf.$parent;
                    leafStyle = firstLeaf.$.style;
                    if (paragraph) {
                        paragraphStyle = paragraph.$.style;
                    }
                }

                var operation = new ApplyStyleToElementOperation(textRange, textFlow, leafStyle, paragraphStyle);
                operation.doOperation();

                configuration.set('textFlow', textFlow);
                textFlow.trigger('operationComplete', null, textFlow);
            },

            _positionConfiguration: function (configuration) {

                var printArea = configuration.$.printArea,
                    printAreaWidth = printArea.get("boundary.size.width"),
                    printAreaHeight = printArea.get("boundary.size.height"),
                    defaultBox = printArea.$.defaultBox || {
                        x: 0,
                        y: 0,
                        width: printAreaWidth,
                        height: printAreaHeight
                    },
                    boundingBox,
                    defaultBoxCenterX = defaultBox.x + defaultBox.width / 2,
                    defaultBoxCenterY = defaultBox.y + defaultBox.height / 2,
                    offset = configuration.$.offset.clone(),
                    newScale;

                boundingBox = configuration._getBoundingBox(null, null, null, null, null, false);

                // position centered within defaultBox
                offset.set({
                    x: defaultBoxCenterX - boundingBox.width / 2,
                    y: defaultBox.y
                });

                if (offset.$.x < 0 || offset.$.x + boundingBox.width > printAreaWidth) {

                    // hard boundary error
                    var maxPossibleWidthToHardBoundary = Math.min(defaultBoxCenterX, printAreaWidth - defaultBoxCenterX) * 2;

                    // scale to avoid hard boundary error
                    var scaleToAvoidCollision = maxPossibleWidthToHardBoundary / boundingBox.width;

                    // scale to fit into default box
                    var scaleToFixDefaultBox = defaultBox.width / boundingBox.width;

                    // TODO: first use scaleToFixDefaultBox and use scaleToAvoidCollission only if
                    // scaleToFitDefaultBox is not possible for print type

                    newScale = scaleToFixDefaultBox; // scaleToFixDefaultBox;

                    configuration.set("scale", {
                        x: newScale,
                        y: newScale
                    });

                    boundingBox = configuration._getBoundingBox();

                    // position centered within defaultBox
                    offset.set({
                        x: defaultBoxCenterX - boundingBox.width / 2,
                        y: defaultBox.y
                    });
                }

                if (boundingBox.height > printAreaHeight) {
                    // y-scale needed to fit print area

                    // calculate maxScale to fix height
                    var maxScaleToFitPrintArea = configuration.$.scale.y * printAreaHeight / boundingBox.height;
                    var maxScaleToFitDefaultBox = configuration.$.scale.y * defaultBox.height / boundingBox.height;

                    // TODO: try the two different scales, prefer defaultBox and fallback to printArea if size to small
                    newScale = maxScaleToFitPrintArea;

                    configuration.set("scale", {
                        x: newScale,
                        y: newScale
                    });

                    boundingBox = configuration._getBoundingBox();

                    // position centered within defaultBox
                    offset.set({
                        x: defaultBoxCenterX - boundingBox.width / 2,
                        y: defaultBoxCenterY - boundingBox.height / 2
                    });

                }

                if (offset.$.y < 0 || offset.$.y + boundingBox.height > printAreaHeight) {
                    // hard boundary error

                    // center in print area
                    offset.set({
                        y: printAreaHeight / 2 - boundingBox.height / 2
                    });
                }

                configuration.set({
                    offset: offset
                });

            }


        });

    });