define([
    "sprd/model/ProductBase",
    'js/core/List',
    'js/data/AttributeTypeResolver',
    'sprd/entity/DesignConfiguration',
    'sprd/entity/TextConfiguration',
    'sprd/entity/Price',
    'js/data/TypeResolver', 'js/data/Entity', "underscore", "flow", "sprd/util/ProductUtil"],
    function (ProductBase, List, AttributeTypeResolver, DesignConfiguration, TextConfiguration, Price, TypeResolver, Entity, _, flow, ProductUtil) {
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

            ctor: function () {
                this.callBase();

                var priceChangeHandler = function () {
                    this.trigger("priceChanged");
                };

                var productChangeHandler = function () {
                    this.trigger("productChanged");
                };

                this.bind("configurations", "add", priceChangeHandler, this);
                this.bind("configurations", "remove", priceChangeHandler, this);
                this.bind("configurations", "reset", priceChangeHandler, this);
                this.bind("configurations", "item:priceChanged", priceChangeHandler, this);

                this.bind('change:productType', productChangeHandler, this);
                this.bind('change:appearance', productChangeHandler, this);
                this.bind('configurations', 'add', productChangeHandler, this);
                this.bind('configurations', 'remove', productChangeHandler, this);
                this.bind('configurations', 'reset', productChangeHandler, this);
                this.bind('configurations', 'item:configurationChanged', productChangeHandler, this);
                this.bind('configurations', 'item:change:printArea', productChangeHandler, this);

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

            /***
             * set the product type and converts all configurations
             *
             * @param {sprd.model.ProductType} productType
             * @param callback
             */
            setProductType: function (productType, callback) {

                var self = this,
                    appearance,
                    view;

                flow()
                    .seq(function (cb) {
                        productType.fetch(null, cb);
                    })
                    .seq(function () {
                        if (self.$.appearance) {
                            appearance = productType.getClosestAppearance(self.$.appearance.getMainColor());
                        } else {
                            appearance = productType.getDefaultAppearance();
                        }
                    })
                    .seq(function () {
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

                        self.$.configurations.remove(removeConfigurations);

                    })
                    .seq(function () {
                        // first set product type
                        // and then the appearance, because appearance depends on product type
                        self.set({
                            productType: productType,
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
                    printType: null,
                    designColorRGBs: null,
                    designColorIds: null
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

                        if (printArea.get("restrictions.designAllowed") == false) {
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
                        var entity = self.createEntity(DesignConfiguration);
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
                        this.vars["designConfiguration"].init(cb);
                    })
                    .seq(function () {
                        // determinate position
                        self._positionConfiguration(this.vars["designConfiguration"]);
                    })
                    .exec(function (err, results) {
                        !err && self._addConfiguration(results.designConfiguration);
                        callback && callback(err, results.designConfiguration);
                    })

            },

            addText: function (params, callback) {

                params = _.defaults({}, params, {
                    text: null,
                    font: null,
                    perspective: null, // front, back, etc...
                    view: null,
                    printArea: null,
                    printType: null,
                    style: "normal",
                    weight: "normal"
                });

                var self = this,
                    context = this.$.context,
                    text = params.text,
                    productType = this.$.productType,
                    printArea = params.printArea,
                    view = params.view,
                    font = null,
                    appearance = this.$.appearance,
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
                        fontFamilies: function(cb) {
                            context.$.fontFamilies.fetch({
                                fullData: true
                            }, cb)
                        },
                        productType: function (cb) {
                            productType.fetch(null, cb);
                        }
                    })
                    .seq("fontFamily", function() {
                        var fontFamily = this.vars["fontFamilies"].at(0);
                        if (!fontFamily) {
                            throw new Error("No found");
                        }

                        font = fontFamily.getFont(params.weight, params.style);

                        if (!font) {
                            self.log("Font with for required style & weight not found. Fallback to default font", "warn");
                        }

                        font = font || fontFamily.getDefaultFont();

                        if (!font) {
                            throw new Error("No font in family found")
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

                        view = self.$.view || self.getDefaultView();
                        if (!printArea && view) {
                            printArea = view.getDefaultPrintArea();
                        }

                        if (!printArea) {
                            throw new Error("target PrintArea couldn't be found.");
                        }

                        if (printArea.get("restrictions.textAllowed") == false) {
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
                    .seq("configuration", function () {
                        var entity = self.createEntity(TextConfiguration);
                        entity.set({
                            printType: printType,
                            printArea: printArea,
                            text: text,
                            font: font
                        });
                        return entity;
                    })
                    .seq(function (cb) {
                        this.vars["configuration"].init(cb);
                    })
                    .seq(function () {
                        // determinate position
                        // TODO: self._positionConfiguration(this.vars["configuration"]);
                    })
                    .exec(function (err, results) {
                        !err && self._addConfiguration(results.configuration);
                        callback && callback(err, results.configuration);
                    })

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

                boundingBox = configuration._getBoundingBox();

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
                    }
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

            save: function (options, callback) {

                if (this.$originalProduct) {
                    if (this.$originalProduct.isDeepEqual(this)) {
                        callback && callback(null, this);
                        return;
                    } else {
                        this.set('id', undefined);
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
                            view: productType.getViewById(self.get("defaultValues.defaultView.id")) || productType.getDefaultView()
                        });
                    })
                    .seq(function (cb) {
                        flow()
                            .parEach(self.$.configurations.$items, function (configuration, cb) {
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
