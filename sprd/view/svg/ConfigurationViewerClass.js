define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', "sprd/entity/SpecialTextConfiguration", "xaml!sprd/view/svg/TextConfigurationRenderer", "xaml!sprd/view/svg/DesignConfigurationRenderer", "xaml!sprd/view/svg/SpecialTextConfigurationRenderer", "underscore", "sprd/type/Vector", "js/core/I18n", "js/core/Bus", "sprd/util/UnitUtil", "sprd/entity/BendingTextConfiguration", "xaml!sprd/view/svg/BendingTextConfigurationRenderer", "sprd/type/Line", "sprd/extensions/Number"],
    function(SvgElement, TextConfiguration, DesignConfiguration, SpecialTextConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer, SpecialTextConfigurationRenderer, _, Vector, I18n, Bus, UnitUtil, BendingTextConfiguration, BendingTextConfigurationRenderer, Line, extension) {

        var MOVE = "move",
            SCALE = "scale",
            RESIZE = "resize";

        var validateConfigurationOnTransform = true,
            rotationSnippingThreshold = 5,
            rotateSnippingEnabled = true,
            scaleSnippingThreshold = 0.02,
            moveSnippingEnabled = true,
            scaleRatioThresholdForRotation = 0.2,
            moveSnippingThreshold = 7;

        var defaultLineLength = 4000;
        //Polyfill
        if (!Math.sign) {
            Math.sign = function(x) {
                // If x is NaN, the result is NaN.
                // If x is -0, the result is -0.
                // If x is +0, the result is +0.
                // If x is negative and not -0, the result is -1.
                // If x is positive and not +0, the result is +1.
                return ((x > 0) - (x < 0)) || +x;
            };
        }

        return SvgElement.inherit({

            defaults: {
                tagName: 'g',
                componentClass: 'configuration-viewer printType-{configuration.printType.id} type-{configurationType()}',
                configuration: null,
                "data-configuration-type": "{configurationType()}",

                translateX: "{_offset.x}",
                translateY: "{_offset.y}",

                rotation: "{_rotation}",
                rotationX: "{half(configuration.width(_scale.x))}",
                rotationY: "{half(configuration.height(_scale.y))}",

                _assetContainer: null,
                _bigScaleHandle: null,

                productViewer: null,
                printAreaViewer: null,
                product: null,

                // tmp. offset during move
                _offset: "{configuration.offset}",
                _scale: "{configuration.scale}",

                _configurationWidth: "{configuration.width(_scale.x)}",
                _configurationHeight: "{configuration.height(_scale.y)}",

                _rotation: "{configuration.rotation}",

                _configurationValid: "{configuration.isValid()}",

                _globalToLocalFactor: {
                    x: 1,
                    y: 1
                },
                focused: "{isFocused()}",
                selected: "{isSelectedConfiguration()}",

                _handleWidth: 15,
                _handleOffset: 0,
                "_handle-Offset": -15,
                _handleIconScale: 1,

                _mode: null,
                _configurationInfo: false,
                _rotationRadius: null,

                imageService: null,
                preventValidation: true,
                downVector: null,
                moveVector: null,
                centerVector: null,
                rotationSnap: null,
                productViewerDiagonalLength: null,
                inverseZoom: "{printAreaViewer.productTypeViewViewer.inverseZoom}",

                minScaleRect: "{getMinScaleRect()}",
                maxScaleRect: "{getMaxScaleRect()}"
            },

            inject: {
                i18n: I18n,
                bus: Bus
            },

            $classAttributes: ["configuration", "product", "printAreaViewer", "assetContainer", "productViewer", "clipPath", "imageService", "downVector", "moveVector", "centerVector", "rotationSnap"],

            ctor: function() {

                this.callBase();

                // this brings the translate transformation before the rotate transformation
                this.translate(0, 0);
                this.rotate(0, 0, 0);

                this._initializeCapabilities(this.$stage.$window);
                this.set('_globalToLocalFactor', this.$.productViewer.globalToLocalFactor());

                if (validateConfigurationOnTransform) {
                    this.bind("_offset", "change", this._transformationChanged, this);
                    this.bind("change:_rotation", this._transformationChanged, this);
                }

                this.bind('configuration', "change:docked", this.dockedConfiguration, this);
                this.bind('productViewer', 'change:width', this._productViewerSizeChanged, this);
                this.bind('productViewer', 'change:viewBoxObj', this._productViewerSizeChanged, this);
                this.bind(["productViewer", "change:selectedConfiguration"], function() {
                    if (this.isSelectedConfiguration()) {
                        this.focus();
                    }
                }, this);
            },

            configurationType: function() {
                var configuration = this.$.configuration;
                return configuration ? configuration.type : "";
            }.onChange("configuration"),

            _initializationComplete: function() {

                var clipPath = this.$.clipPath;
                var transformations = clipPath.$.transformations;

                transformations.unshift(transformations.removeAt(1));

                this.callBase();

                this.set("preventValidation", false);
                this.set('productViewerDiagonalLength', this.$.productViewer.getViewBoxDiagonal().distance());

            },

            id: function() {
                return "c" + this.$cid;
            },

            invert: function(value) {
                return value * -1;
            },

            getLocalizedSize: function(mm, fixed) {
                if (fixed != null && typeof(mm) == "number") {
                    mm = mm.toFixed(fixed);
                }
                return UnitUtil.getLocalizedSize(mm, this.PARAMETER().locale);
            },

            and: function(a, b) {
                return a && b
            },

            dockedConfiguration: function() {
                this.get("configuration.docked") ? this.addClass("docked") : this.removeClass("docked");
            },

            formatSize: function(size) {
                if (size != null) {
                    return parseInt(size).toFixed(0);
                }
                return size;
            },

            _initializeCapabilities: function(window) {
                var runsInBrowser = this.runsInBrowser();
                this.$hasTouch = runsInBrowser && ('ontouchstart' in window);
            },

            _renderFocused: function(focused) {
                if (focused) {
                    this.addClass('focused');
                } else {
                    this.removeClass('focused');
                }

            },

            _initializeRenderer: function() {

                var rendererFactory,
                    assetContainer = this.$._assetContainer,
                    configuration = this.$.configuration;

                if (configuration instanceof SpecialTextConfiguration) {
                    rendererFactory = SpecialTextConfigurationRenderer;
                } else if (configuration instanceof BendingTextConfiguration) {
                    rendererFactory = BendingTextConfigurationRenderer;
                } else if (configuration instanceof DesignConfiguration) {
                    rendererFactory = DesignConfigurationRenderer;
                } else if (configuration instanceof TextConfiguration) {
                    rendererFactory = TextConfigurationRenderer;
                }

                if (rendererFactory) {
                    this.$asset = this.createComponent(rendererFactory, {
                        configuration: configuration,
                        productViewer: this.$.productViewer,
                        configurationViewer: this,
                        _width: '{productViewer.width}',
                        imageService: this.$.imageService
                    });

                    var softBoundary = this.get("_viewMap.printArea.boundary.soft.content.svg.path.d");

                    if (softBoundary) {
                        softBoundary = this.createComponent(SvgElement, {
                            tagName: "path",
                            d: softBoundary
                        });

                        this.$.clipPath.addChild(softBoundary);
                        this.$._assetContainerWrapper.set('clip-path', "url(#" + this.$.cv.id() + ")");
                    } else {
                        this.$._assetContainerWrapper.set('clip-path', null);
                        this.$.clipPath.set("visible", false);
                    }

                    if (assetContainer) {
                        assetContainer.addChild(this.$asset);
                    } else {
                        this.log("No assetContainer available", "error");
                    }

                } else {
                    this.log("Cannot create renderer for configuration", "error");
                }

                this.callBase();
            },

            _bindDomEvents: function() {
                this.callBase();

                var self = this,
                    productViewer = this.$.productViewer;

                if (!this.runsInBrowser()) {
                    return;
                }

                productViewer.bindDomEvent("contextmenu", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });

                if (productViewer && productViewer.$.editable === true) {
                    var assetContainer = this.$._assetContainer,
                        scaleHandle = this.$._bigScaleHandle;

                    assetContainer.bindDomEvent("pointerdown", function(e) {
                        self._down(e, MOVE);
                    });

                    scaleHandle && scaleHandle.bindDomEvent("pointerdown", function(e) {
                        self._down(e, SCALE, scaleHandle);
                    });

                    var preventDefault = function(e) {
                        e.preventDefault && e.preventDefault();
                        return false;
                    };

                    this.bindDomEvent("click", function(e) {
                        e.stopPropagation && e.stopPropagation();
                        return false;
                    });

                    scaleHandle && scaleHandle.bindDomEvent("click", preventDefault);
                }

            },

            _isGesture: function(e) {
                return false;
            },

            _productViewerSizeChanged: function() {
                this.set('_globalToLocalFactor', this.$.productViewer.globalToLocalFactor());
                this.set('productViewerDiagonalLength', this.$.productViewer.getViewBoxDiagonal().distance());
            },


            _transformationChanged: function() {

                var configuration = this.$.configuration;
                if (configuration) {

                    var self = this;

                    !self.$.preventValidation && this._debounceFunctionCall(function() {
                        configuration._setError(configuration._validateTransform({
                            offset: this.$._offset,
                            scale: this.$._scale,
                            rotation: this.$._rotation
                        }));
                    }, "transformationChanged");
                }
            },

            _commitSelected: function() {
                this.$wasSelected = false;
            },

            addSnapLine: function(x, y, rot, owner) {
                var newLine = new Line(x, y, rot, defaultLineLength);
                var alreadyAdded = false;
                for (var i = 0; i < this.$snapLines.length; i++) {
                    var owners = this.$snapLines[i].owners;
                    var line = this.$snapLines[i].line;
                    if (line.equals(newLine)) {
                        if (owners.indexOf(owner) === -1) {
                            owners.push(owner);
                        }

                        alreadyAdded = true;
                    }
                }

                if (!alreadyAdded) {
                    this.$snapLines.push({owners: [owner], line: newLine});
                }
            },

            addSnapValue: function(value, owner, list) {
                var alreadyAdded = false;
                for (var i = 0; i < list.length; i++) {
                    var owners = list[i].owners;
                    var currentValue = list[i].value;
                    if (value === currentValue) {
                        if (owners.indexOf(owner) === -1) {
                            owners.push(owner);
                        }

                        alreadyAdded = true;
                    }
                }

                if (!alreadyAdded) {
                    this.$snapAngles.push({owners: [owner], value: value});
                }
            },

            addSnapLinesAtPoint: function(x, y, rot, owner) {
                this.addSnapLine(x, y, rot, owner);
                this.addSnapLine(x, y, rot + Math.PI / 2, owner);
            },

            addSnapLines: function(point, dimension, length, pointAmounts, midPoint, rot, owner) {
                var stepSize = length / (pointAmounts - 1),
                    currentPoint = _.clone(point),
                    rotatedPoint;

                for (var i = 0; i < pointAmounts; i++) {
                    currentPoint[dimension] = point[dimension] + i * stepSize;
                    rotatedPoint = this.rotatePoint(currentPoint.x, currentPoint.y, rot, midPoint);
                    this.addSnapLinesAtPoint(rotatedPoint.x, rotatedPoint.y, rot, owner);
                }
            },

            rotatePoint: function(x, y, rot, midX, midY) {

                if (midX instanceof Object) {
                    midY = midX.y;
                    midX = midX.x;
                }

                var sin = Math.sin(rot);
                var cos = Math.cos(rot);
                var difX = x - midX;
                var difY = y - midY;


                return {
                    x: midX + (difX * cos - difY * sin),
                    y: midY + (difX * sin + difY * cos)
                };
            },

            distanceFromMidPoint: function(x, y, midX, midY) {
                return Math.sqrt(Math.pow(x - midX, 2) + Math.pow(y - midY, 2));
            },

            addSnapLinesOfRect: function(startPoint, width, height, rot, owner) {
                var midPoint = {
                    x: startPoint.x + width / 2,
                    y: startPoint.y + height / 2
                };
                this.addSnapLines(startPoint, 'x', width, 3, midPoint, rot, owner);
                this.addSnapLines(startPoint, 'y', height, 3, midPoint, rot, owner);
            },

            getRectFromTextConfiguration: function(configuration, x, y) {
                if (!configuration) {
                    return null;
                }

                var offset = configuration.$.offset,
                    bound = configuration.$.bound,
                    scale = configuration.$.scale;

                if (!bound || !scale || !offset) {
                    return null;
                }

                x = x || offset.$.x;
                y = y || offset.$.y;

                var corner = {
                    x: x + bound.x * scale.x,
                    y: y + bound.y * scale.y
                };

                var height = bound.height * scale.x;
                var width = bound.width * scale.y;
                return {topLeft: corner, height: height, width: width};
            },

            getRectFromConfiguration: function(configuration, x, y) {
                if (!configuration) {
                    return null;
                }

                var offset = configuration.$.offset;

                if (!offset) {
                    return null;
                }

                x = x || offset.$.x;
                y = y || offset.$.y;

                if (configuration instanceof TextConfiguration) {
                    var textRect = this.getRectFromTextConfiguration(configuration, x, y);
                    if (textRect) {
                        return textRect;
                    }
                }

                var corner = {
                    x: x,
                    y: y
                };

                return {
                    topLeft: corner,
                    height: configuration.height(),
                    width: configuration.width()
                };
            },

            addSnapLinesOfConfiguration: function(otherConfiguration) {
                var rect = this.getRectFromConfiguration(otherConfiguration);
                var rot = this.degreeToRadian(otherConfiguration.$.rotation);

                if (!rect) {
                    return;
                }

                this.addSnapLinesOfRect(rect.topLeft, rect.width, rect.height, rot, otherConfiguration);
            },

            addSnapAnglesOfConfiguration: function(otherConfiguration) {
                this.addSnapValue(otherConfiguration.$.rotation, otherConfiguration, this.$snapAngles);
                this.addSnapValue(otherConfiguration.$.rotation + 180, otherConfiguration, this.$snapAngles);
            },

            addSnapLinesOfOtherConfigurations: function(productViewer, configuration) {
                if (productViewer && productViewer.$.product) {
                    var configurationsOnPrintArea = productViewer.$.product.getConfigurationsOnPrintAreas([configuration.$.printArea]) || [],
                        myIndex = _.indexOf(configurationsOnPrintArea, configuration);

                    if (myIndex !== -1) {
                        configurationsOnPrintArea.splice(myIndex, 1);
                    }

                    for (var i = 0; i < configurationsOnPrintArea.length; i++) {
                        var otherConfiguration = configurationsOnPrintArea[i];
                        this.addSnapLinesOfConfiguration(otherConfiguration);
                    }
                }
            },

            addSnapAnglesOfOtherConfigurations: function(productViewer, configuration) {
                if (productViewer && productViewer.$.product) {
                    var configurationsOnPrintArea = productViewer.$.product.getConfigurationsOnPrintAreas([configuration.$.printArea]) || [],
                        myIndex = _.indexOf(configurationsOnPrintArea, configuration);

                    if (myIndex !== -1) {
                        configurationsOnPrintArea.splice(myIndex, 1);
                    }

                    for (var i = 0; i < configurationsOnPrintArea.length; i++) {
                        var otherConfiguration = configurationsOnPrintArea[i];
                        this.addSnapAnglesOfConfiguration(otherConfiguration);
                    }
                }
            },

            addSnapLinesOfPrintArea: function(configuration) {
                var leftUpperCorner = {x: 0, y: 0},
                    printArea = configuration.$.printArea;

                if (!printArea) {
                    return;
                }

                var midPoint = {x: printArea.width() / 2, y: printArea.height() / 2};
                this.addSnapLines(midPoint, 'x', printArea.width() / 2, 2, midPoint, 0, printArea);
                this.addSnapLines(midPoint, 'x', -printArea.width() / 2, 2, midPoint, 0, printArea);
                this.addSnapLines(midPoint, 'y', printArea.height() / 2, 2, midPoint, 0, printArea);
                this.addSnapLines(midPoint, 'y', -printArea.height() / 2, 2, midPoint, 0, printArea);
            },

            toScreenCoords: function(vector, svg, CTMmatrix) {
                svg = svg || this.getSvgRoot().$el;
                CTMmatrix = CTMmatrix || svg.getScreenCTM();
                var svgPoint = this.toSvgPoint(vector, svg);
                return Vector.createFromPoint(svgPoint.matrixTransform(CTMmatrix));
            },

            toSvgCoords: function(vector, svg, CTMmatrix) {
                svg = svg || this.getSvgRoot().$el;
                CTMmatrix = CTMmatrix || svg.getScreenCTM();
                var svgPoint = this.toSvgPoint(vector, svg);
                return Vector.createFromPoint(svgPoint.matrixTransform(CTMmatrix.inverse()));
            },

            toSvgPoint: function(vector, svg) {
                var svgPoint = svg.createSVGPoint();
                svgPoint.x = vector.getX();
                svgPoint.y = vector.getY();
                return svgPoint;
            },

            localToGlobalFactor: function() {
                var matrix = this.$.printAreaViewer.$.productTypeViewViewer.$el.getScreenCTM();
                return {x: matrix.a, y: matrix.d};
            },

            globalToLocalFactor: function() {
                var matrix = this.$.printAreaViewer.$.productTypeViewViewer.$el.getScreenCTM().inverse();
                return {x: matrix.a, y: matrix.d};
            },

            _down: function(e, mode, initiator) {

                var self = this,
                    configuration = this.$.configuration,
                    factor,
                    downPoint;

                if (!configuration) {
                    return;
                }

                if (!this.runsInBrowser()) {
                    return;
                }

                if (!this.$hasTouch && e.which !== 1) {
                    // not left mouse button
                    return;
                }

                this.$moveInitiator = initiator;

                // there is a current action and another down -> gesture
                if (this.$._mode !== null) {
                    // unbind the current handler
                    this._unbindTransformationHandler();
                }

                var selected = this.$.selected,
                    productViewer = this.$.productViewer,
                    previousSelectedConfiguration = this.$.productViewer.$.selectedConfiguration;

                productViewer.set("selectedConfiguration", this.$.configuration);
                this.$.bus.trigger('ConfigurationViewer.configurationSelected', {
                    configuration: configuration
                });

                this.$.printAreaViewer.set('selected', true);
                this.addClass('transforming');

                if (e.defaultPrevented) {
                    return;
                }

                e.preventDefault && e.preventDefault();

                downPoint = this.$downPoint = {
                    x: e.changedTouches ? e.changedTouches[0].pageX : e.pageX,
                    y: e.changedTouches ? e.changedTouches[0].pageY : e.pageY
                };

                var downVector = new Vector([downPoint.x, downPoint.y]);

                factor = this.localToGlobalFactor();
                var halfWidth = (configuration.width() / 2) * factor.x,
                    halfHeight = (configuration.height() / 2) * factor.y,
                    svgRoot = this.getSvgRoot(),
                    middlePoint = new Vector([configuration.width() / 2, configuration.height() / 2]),
                    matrix = this.$el.getScreenCTM();

                this.set('centerVector', middlePoint);
                this.$centerVector = this.toScreenCoords(middlePoint, svgRoot.$el, matrix);

                self.set('downVector', this.toSvgCoords(downVector, svgRoot.$el, matrix).subtract(this.toSvgCoords(this.$centerVector, svgRoot.$el, matrix)));


                this.$moving = true;
                this.set({
                    "_mode": mode,
                    shiftKey: false
                });

                this._removeSnapLines();
                this.$snapLines = [];
                this.$snapAngles = [];

                if (moveSnippingEnabled) {
                    this.addSnapLinesOfOtherConfigurations(productViewer, configuration);
                    this.addSnapLinesOfPrintArea(configuration);
                    this.addSnapAnglesOfOtherConfigurations(productViewer, configuration);
                }

                if (mode === MOVE) {
                    this.set('_offset', configuration.$.offset.clone());
                } else if (mode === SCALE) {
                    this.set({
                        _scale: _.clone(configuration.$.scale),
                        _offset: configuration.$.offset.clone()
                    });

                    var scaleVector = downVector.subtract(this.$centerVector);

                    // diagonal in real px
                    this.$scaleDiagonalDistance = scaleVector.distance();
                    this.$startRotateVector = downVector.subtract(this.$centerVector);
                    this.set("_rotationRadius", Vector.distance([halfHeight, halfWidth]) / factor.x);
                }

                var $w = this.$stage.$window;
                this.$window = this.$window || this.dom($w);

                var window = this.$window;

                // shim layer with setTimeout fallback
                $w.requestAnimFrame = $w.$requestAnimFrame || (function() {
                        return $w.requestAnimationFrame ||
                            $w.webkitRequestAnimationFrame ||
                            $w.mozRequestAnimationFrame ||
                            function(callback) {
                                $w.setTimeout(callback, 1000 / 60);
                            };
                    })();

                this.$requestAnimCallback = this.$requestAnimCallback || function() {
                        self._callMove();
                    };

                this.$moveHandler = function(e) {
                    e.preventDefault();

                    window.unbindDomEvent("pointermove", self.$moveHandler);

                    selected = true;

                    self.$moveState = self.$moveState || {
                            active: false,
                            e: e,
                            mode: mode
                        };
                    self.$moveState.e = e;
                    self.$moveState.mode = mode;
                    if (!self.$moveState.active) {
                        self.$moveState.active = true;
                        $w.requestAnimFrame(self.$requestAnimCallback);
                    }
                };

                this.$upHandler = function(e) {
                    var distance = self.getDistance(configuration.$.offset, self.$._offset);
                    var onlyPointed = !(distance) && mode === MOVE && !self.$moveInitiator;

                    if (!onlyPointed) {
                        self.$.bus.trigger('ConfigurationViewer.pointerUp');
                    }

                    if (onlyPointed && configuration == previousSelectedConfiguration) {
                        self.$.bus.trigger('ConfigurationViewer.configurationReselected', {
                            configuration: configuration,
                            previousConfiguration: previousSelectedConfiguration
                        });
                    }

                    if (selected) {
                        self._up(e, mode);
                    } else {
                        self.$moving = false;
                        if (configuration.$.offset && configuration.$.offset !== self.$._offset) {
                            configuration.set('offset', self.$._offset);
                        }
                        self.set('_configurationInfo', false);
                    }

                    self._stopTransformation();
                };

                this.$keyDownHandler = function(e) {
                    self._keyDown(e, mode);
                };

                this.$keyUpHandler = function(e) {
                    self._keyUp(e, mode);
                };

                window.bindDomEvent("pointermove", this.$moveHandler);
                window.bindDomEvent("pointerup", this.$upHandler);


                if (!this.$stage.$browser.hasTouch || this.$stage.$browser.isIOS) {
                    window.bindDomEvent("keydown", this.$keyDownHandler);
                    window.bindDomEvent("keyup", this.$keyUpHandler);
                }

            },

            removeDocking: function() {
                var configuration = this.$.configuration;
                if (!configuration) {
                    return;
                }

                var printArea = configuration.$.printArea;

                if (!printArea) {
                    return;
                }

                printArea.set('docked', false);

                var product = this.get('productViewer.product');

                if (product) {
                    var configurationsOnPrintArea = product.getConfigurationsOnPrintAreas([printArea]) || [];
                    _.each(configurationsOnPrintArea, function(config) {
                        config.set('docked', false);
                    })
                }
            },

            _removeSnapLines: function() {
                var snapLines = this.$.printAreaViewer.$.snapLines;
                snapLines && snapLines.clear();
                this.removeDocking();
            },

            _beforeDestroy: function() {
                this.callBase();

                this._removeSnapLines();

                var $w = this.$stage.$window;
                this.$window = this.$window || this.dom($w);

                var window = this.$window;

                window.unbindDomEvent("pointermove", this.$moveHandler);
                window.unbindDomEvent("pointerup", this.$upHandler);

            },

            _callMove: function() {

                if (this.$moveState && this.$moveState.active) {
                    this.$moveState.active = false;
                    this._move(this.$moveState.e, this.$moveState.mode);
                }
                if (this.$moving && this.$window) {
                    this.$window.bindDomEvent("pointermove", this.$moveHandler);
                }
            },

            deleteConfiguration: function(e) {

                if (!this.$hasTouch && e.domEvent.which !== 1) {
                    // not a first mouse button click
                    return;
                }

                if (this.$.product) {
                    var configuration = this.$.configuration,
                        productViewer = this.$.productViewer;

                    this.$.product.$.configurations.remove(configuration);
                    e.preventDefault();

                    this.$.bus.trigger('Application.productChanged', this.$.product);
                    if (productViewer && productViewer.$.selectedConfiguration === configuration) {
                        productViewer.set('selectedConfiguration', null);
                    }

                }
            },


            snapAngle: function(configuration, value) {
                if (rotateSnippingEnabled && !this.$.shiftKey) {
                    var snapStepSize = 45;
                    var snapPoints = _.range(0, 360 + snapStepSize, snapStepSize);
                    snapPoints.push(configuration.$.rotation);
                    for (var i = 0; i < snapPoints.length; i++) {
                        this.$snapAngles.push({value: snapPoints[i], owner: null});
                    }

                    value = this.snapOneDimension(value, this.$snapAngles, rotationSnippingThreshold);
                    var snapped = _.find(this.$snapAngles, function(ownedPoint) {
                        return ownedPoint.value == value;
                    });

                    value %= 360;
                    this.set('rotationSnap', this.$.centerVector && snapped);
                }

                return value;
            },

            snapScale: function(configuration, scale) {
                if (rotateSnippingEnabled && !this.$.shiftKey) {
                    scale = this.snapOneDimension(scale, [1], scaleSnippingThreshold);
                }

                return scale;
            },

            snapOneDimension: function(value, snapValues, threshold) {
                for (var i = 0; i < snapValues.length; i++) {
                    var snapPoint = snapValues[i],
                        difference = snapPoint.value - value,
                        distance = Math.abs(difference),
                        snapDifference, snapDistance = Number.MAX_VALUE,
                        snappedPoint;

                    if (distance < threshold && distance < snapDistance) {
                        snapDifference = difference;
                        snapDistance = distance;
                        snappedPoint = snapPoint;
                    }
                }

                if (snapDifference) {
                    value += snapDifference;
                    _.each(snappedPoint.owners, function(owner) {
                        owner.set('docked', true);
                    });
                }

                return value;
            },

            _rotate: function(x, y, configuration, userInteractionOptions) {
                var startVector = this.$startRotateVector;

                var currentVector = Vector.subtract([x, y], this.$centerVector);

                var scalarProduct = Vector.scalarProduct(startVector, currentVector);
                var normalizedProduct = scalarProduct / (startVector.distance() * currentVector.distance());
                normalizedProduct = normalizedProduct.equals(1) ? 1 : normalizedProduct;
                normalizedProduct = normalizedProduct.equals(-1) ? -1 : normalizedProduct;
                var rotateAngle = Math.acos(normalizedProduct) * 180 / Math.PI;
                var crossVector = Vector.vectorProduct(startVector, currentVector);

                if (crossVector.components[2] < 0) {
                    rotateAngle *= -1;
                }

                rotateAngle = Math.round(configuration.$.rotation + rotateAngle, 2);
                rotateAngle %= 360;
                if (rotateAngle < 0) {
                    rotateAngle += 360;
                }

                rotateAngle = this.snapAngle(configuration, rotateAngle);

                var factor = this.localToGlobalFactor();
                var halfWidth = (this.$._configurationWidth / 2) * factor.x,
                    halfHeight = (this.$._configurationHeight / 2) * factor.y;

                this.set("_rotationRadius", Vector.distance([halfHeight, halfWidth]) / factor.x);
                this.set("_rotation", rotateAngle, userInteractionOptions);
            },

            rotateRect: function(configuration, newX, newY, rot) {
                var rect = this.getRectFromConfiguration(configuration, newX, newY);

                if (!rect) {
                    return null;
                }

                var rotatePoint = {
                    x: newX + configuration.width() / 2,
                    y: newY + configuration.height() / 2
                };

                var topLeftCorner = rect.topLeft;
                var rotatedTopLeftCorner = this.rotatePoint(topLeftCorner.x, topLeftCorner.y, rot, rotatePoint.x, rotatePoint.y);
                var rotatedBottomRightCorner = this.rotatePoint(topLeftCorner.x + rect.width, topLeftCorner.y + rect.height, rot, rotatePoint.x, rotatePoint.y);
                var rotatedBottomLeftCorner = this.rotatePoint(topLeftCorner.x, topLeftCorner.y + rect.height, rot, rotatePoint.x, rotatePoint.y);
                var rotatedTopRightCorner = this.rotatePoint(topLeftCorner.x + rect.width, topLeftCorner.y, rot, rotatePoint.x, rotatePoint.y);
                var rotateMiddlePoint = this.rotatePoint(topLeftCorner.x + rect.width / 2, topLeftCorner.y + rect.height / 2, rot, rotatePoint.x, rotatePoint.y);

                return {
                    midPoint: rotateMiddlePoint,
                    topLeftCorner: rotatedTopLeftCorner,
                    bottomRightCorner: rotatedBottomRightCorner,
                    bottomLeftCorner: rotatedBottomLeftCorner,
                    topRightCorner: rotatedTopRightCorner
                };
            },

            getSnapPoints: function(configuration, newX, newY, rot) {
                var rect = this.rotateRect(configuration, newX, newY, rot);
                if (!rect) {
                    return null;
                }

                return [rect.topLeftCorner, rect.topRightCorner, rect.midPoint, rect.bottomLeftCorner, rect.bottomRightCorner];
            },

            getSides: function(configuration, newX, newY, rot) {
                var rect = this.rotateRect(configuration, newX, newY, rot);

                if (!rect) {
                    return null;
                }

                var upperHorizontal = new Line(rect.topLeftCorner.x, rect.topLeftCorner.y, rot);
                var lowerHorizontal = new Line(rect.bottomLeftCorner.x, rect.bottomLeftCorner.y, rot);
                var leftVertical = new Line(rect.topLeftCorner.x, rect.topLeftCorner.y, rot + Math.PI / 2);
                var rightVertical = new Line(rect.topRightCorner.x, rect.topRightCorner.y, rot + Math.PI / 2);
                return [upperHorizontal, lowerHorizontal, leftVertical, rightVertical];
            },

            broadcastSnappedLines: function(snappedLines) {
                this.$.bus.trigger('ConfigurationViewer.snappedToLine', {
                    configurationViewer: this,
                    lines: snappedLines
                });

                if (snappedLines && snappedLines.length > 0) {
                    var snapLinesList = this.$.printAreaViewer.$.snapLines;
                    if (snapLinesList) {
                        snapLinesList.reset(snappedLines);
                    }
                }
            },

            snapMove: function(configuration, deltaX, deltaY) {
                var self = this,
                    snappedLines = [],
                    factor = this.globalToLocalFactor(),
                    threshold = moveSnippingThreshold * factor.x;

                var newX = configuration.$.offset.$.x - deltaX * factor.x,
                    newY = configuration.$.offset.$.y - deltaY * factor.y,
                    potentialPosition, snapDistance = Math.max(), snappedLine, snapPosDeltaX, snapPosDeltaY, snappedOwners,
                    rot = self.degreeToRadian(this.$._rotation), owners, snapLine;

                this.removeDocking();

                var differenceVector;
                if (!this.$.shiftKey) {

                    var distance, side;
                    var lines = this.$snapLines.slice();
                    do {
                        snapDistance = Math.max();
                        var sides = this.getSides(configuration, newX, newY, rot);
                        var snapPoints = this.getSnapPoints(configuration, newX, newY, rot);
                        for (var i = 0; sides && i < sides.length; i++) {
                            side = sides[i];
                            for (var l = 0; l < lines.length; l++) {
                                snapLine = lines[l].line;
                                owners = lines[l].owners;

                                if (!snapLine.isParallelTo(side)) {
                                    continue;
                                }


                                differenceVector = side.difference(snapLine);
                                distance = differenceVector.distance();

                                if (Math.abs(distance) <= threshold && Math.abs(distance) < Math.abs(snapDistance)) {
                                    snappedOwners = owners;
                                    snapDistance = distance;
                                    snappedLine = snapLine;
                                    snapPosDeltaX = differenceVector.getX();
                                    snapPosDeltaY = differenceVector.getY();
                                }
                            }

                        }

                        for (var p = 0; snapPoints && p < snapPoints.length; p++) {
                            var snapPoint = snapPoints[p];
                            var rotatedVector = new Vector([snapPoint.x, snapPoint.y]);

                            for (l = 0; l < lines.length; l++) {
                                owners = lines[l].owners;
                                snapLine = lines[l].line;

                                potentialPosition = snapLine.project(snapPoint.x, snapPoint.y);
                                distance = rotatedVector.subtract(potentialPosition).distance();

                                if (Math.abs(distance) <= threshold && Math.abs(distance) < Math.abs(snapDistance)) {
                                    snappedOwners = owners;
                                    snapDistance = distance;
                                    snappedLine = snapLine;
                                    snapPosDeltaX = snapPoint.x - potentialPosition.getX();
                                    snapPosDeltaY = snapPoint.y - potentialPosition.getY();
                                }

                            }
                        }

                        if (Math.abs(snapDistance) <= threshold) {
                            newX -= snapPosDeltaX;
                            newY -= snapPosDeltaY;

                            var productViewerDiagonalLength = this.$.productViewerDiagonalLength;
                            snappedLines.push(snappedLine.getSvgLine(productViewerDiagonalLength));
                            lines = _.filter(lines, function(snapLine) {
                                return snappedLine.isPerpendicular(snapLine.line);
                            });
                            _.each(snappedOwners, function(owner) {
                                owner.set('docked', true);
                            });

                        }
                    } while (lines.length > 0 && Math.abs(snapDistance) <= threshold);
                }

                self.broadcastSnappedLines(snappedLines);

                return {x: newX, y: newY};
            },

            _move: function(e, mode) {

                if (!this.$moving) {
                    return;
                }


                var self = this,
                    configuration = this.$.configuration;

                if (!configuration) {
                    return;
                }

                var x = e.changedTouches ? e.changedTouches[0].pageX : e.pageX,
                    y = e.changedTouches ? e.changedTouches[0].pageY : e.pageY,
                    factor = this.globalToLocalFactor(),
                    deltaX = (this.$downPoint.x - x),
                    deltaY = (this.$downPoint.y - y);

                var scaleFactor,
                    userInteractionOptions = {
                        userInteraction: true
                    },
                    downVector,
                    currentDistance,
                    currentVector,
                    newConfigurationWidth,
                    newConfigurationHeight,
                    svgRoot = this.getSvgRoot(),
                    matrix = this.$el.getScreenCTM();

                downVector = new Vector([x, y]);
                currentVector = downVector.subtract(this.$centerVector);
                self.set('moveVector', this.toSvgCoords(downVector, svgRoot.$el, matrix).subtract(this.toSvgCoords(this.$centerVector, svgRoot.$el, matrix)));
                currentDistance = currentVector.distance();

                this.set('_configurationInfo', true);
                this.set('rotationSnap', false);
                this._removeSnapLines();
                if (mode === MOVE) {
                    var newX = configuration.$.offset.$.x - deltaX * factor.x,
                        newY = configuration.$.offset.$.y - deltaY * factor.y;

                    if (moveSnippingEnabled) {
                        var snappedPoint = this.snapMove(configuration, deltaX, deltaY);
                        newX = snappedPoint.x;
                        newY = snappedPoint.y;
                    }

                    this.$._offset.set({
                        x: newX,
                        y: newY
                    }, userInteractionOptions);

                }
                else if (mode === RESIZE) {
                    var rot = this.degreeToRadian(this.$._rotation),
                        sin = Math.sin(rot),
                        cos = Math.cos(rot);

                    // diagonal in real px
                    var currentDistanceX = x - this.$topLeftPoint.components[0];
                    var currentDistanceY = y - this.$topLeftPoint.components[1];

                    scaleFactor = (currentDistanceX * cos - sin * currentDistanceY) / this.$resizeDistanceX;

                    var width = Math.abs(this.$textArea.$.width * scaleFactor);
                    var widthDiff = width - configuration.$.textArea.$.width;

                    configuration.$.textArea.set('width', width);
                    scaleFactor = (currentDistanceX * sin + cos * currentDistanceY) / this.$resizeDistanceY;

                    var height = Math.abs(this.$textArea.$.height * scaleFactor);
                    var heightDiff = height - configuration.$.textArea.$.height;
                    configuration.$.textArea.set('height', height);

                    rot = this.degreeToRadian(this.$._rotation);
                    sin = Math.sin(rot);
                    cos = Math.cos(rot);

                    var vX = (cos * widthDiff - sin * heightDiff) * 0.5;
                    var vY = (sin * widthDiff + cos * heightDiff) * 0.5;


                    configuration.$.offset.set('x', configuration.$.offset.$.x + (vX - widthDiff * 0.5) * configuration.$.scale.x);
                    configuration.$.offset.set('y', configuration.$.offset.$.y + (vY - heightDiff * 0.5) * configuration.$.scale.y);

                    configuration._debouncedComposeText();
                    configuration.trigger("sizeChanged");

                } else if (mode === SCALE) {
                    var baseScale = this.get('configuration.scale.y'),
                        currentScale = this.$._scale.y,
                        scaleDifference = Math.abs(currentScale - baseScale),
                        scaleDifferenceRatio = scaleDifference / baseScale;

                    if (!(this.scales() && scaleDifferenceRatio > scaleRatioThresholdForRotation)) {
                        this._rotate(x, y, configuration, userInteractionOptions);
                    }

                    if (!this.rotates()) {
                        scaleFactor = currentDistance / this.$scaleDiagonalDistance;
                        scaleFactor = this.snapScale(configuration, scaleFactor);
                        var newScale = {
                            x: scaleFactor * configuration.$.scale.x,
                            y: scaleFactor * configuration.$.scale.y
                        };


                        if (this.validateScale(newScale.x, baseScale)) {
                            this.set('_scale', newScale, userInteractionOptions);
                            this.$._offset.set(this.getCenteredOffset(configuration, newScale), userInteractionOptions);
                        }
                    }
                }
            },

            validateScale: function(newScale, oldScale) {
                if (!newScale) {
                    return false;
                }

                if (!oldScale) {
                    return true;
                }

                var configuration = this.$.configuration;

                if (!configuration) {
                    return false;
                }

                var printArea = configuration.$.printArea;

                if (!printArea) {
                    return false;
                }

                var scaleDirection = Math.sign(newScale - oldScale), // positive means increasing
                    newWidth = configuration.width(newScale),
                    newHeight = configuration.height(newScale),
                    minDimensionSize = Math.min(newWidth, newHeight),
                    maxScale = configuration.getMaxScale(),
                    minScale = configuration.getMinScale(),
                    willBecomeTooSmallAbs = minDimensionSize <= configuration.$.minSize && scaleDirection < 0;

                var tooWideForPrintArea = newWidth / printArea.get('_size.width') > printArea.get('restrictions.maxConfigRatio'),
                    tooTallForPrintArea = newHeight / printArea.get('_size.height') > printArea.get('restrictions.maxConfigRatio'),
                    tooBigForPrintAreaRel = tooWideForPrintArea && tooTallForPrintArea;

                var tooThinForPrintArea = newWidth / printArea.get('_size.width') < printArea.get('restrictions.minConfigRatio'),
                    tooShortForPrintArea = newHeight / printArea.get('_size.height') < printArea.get('restrictions.minConfigRatio'),
                    tooSmallForPrintAreaRel = tooThinForPrintArea && tooShortForPrintArea;

                var hasSoftBoundary = configuration.get('printArea.hasSoftBoundary()'),
                    invalidRelSize = !hasSoftBoundary && (tooBigForPrintAreaRel || tooSmallForPrintAreaRel),
                    scaleThresholdValid = this.scaleThresholdValid(newScale, oldScale);
                return scaleThresholdValid && !willBecomeTooSmallAbs && !invalidRelSize;
            },

            scaleThresholdValid: function (newScale, oldScale) {
                if (!newScale) {
                    return true;
                }

                if (!oldScale) {
                    return true;
                }

                var configuration = this.$.configuration;

                if (!configuration) {
                    return false;
                }

                if (newScale === oldScale) {
                    return true;
                }

                var maxScale = configuration.getMaxScale(),
                    minScale = configuration.getMinScale(),
                    scaleDirection = Math.sign(newScale - oldScale) > 0, // positive means increasing
                    scaleTooBig = scaleDirection && newScale > maxScale && this.getMaxScaleRect().strict,
                    scaleTooSmall = !scaleDirection && newScale < minScale && this.getMinScaleRect().strict;

                return !scaleTooBig && !scaleTooSmall;
            },

            getCenteredOffset: function(configuration, scale) {
                var offsetX = configuration.$.offset.$.x;
                var offsetY = configuration.$.offset.$.y;

                var newConfigurationWidth = configuration.width(scale.x);
                var newConfigurationHeight = configuration.height(scale.y);
                var configurationWidth = configuration.width();
                var configurationHeight = configuration.height();

                return {
                    x: offsetX + (configurationWidth - newConfigurationWidth) / 2,
                    y: offsetY + (configurationHeight - newConfigurationHeight) / 2
                }
            },

            _up: function(e, mode) {
                if (!this.$moving) {
                    return;
                }

                this._removeSnapLines();
                var configuration = this.$.configuration;
                if (configuration) {
                    var changed = false;
                    if (mode === MOVE) {
                        if (configuration.$.offset && configuration.$.offset !== this.$._offset) {
                            configuration.set('offset', this.$._offset);
                            changed = true;
                        }
                    } else if (mode === SCALE) {
                        changed = configuration.$.offset !== this.$._offset && configuration.$.scale !== this.$._scale || configuration.$.rotation !== this.$._rotation;
                        configuration.set({
                            scale: this.$._scale,
                            offset: this.$._offset,
                            rotation: this.$._rotation
                        });
                    }

                    if (changed) {
                        this.$.bus.trigger('Application.productChanged', this.$.product);
                    }
                }


                var window = this.dom(this.$stage.$window),
                    f = function(e) {
                        // capture phase event to prevent click
                        // which closes menus etc.
                        e.stopPropagation();
                        window.unbindDomEvent("click", f, true);
                    };

                window.bindDomEvent("click", f, true);

                // chrome does it right and dispatches a click, but
                // the mobile devices and also ff, safari needs to unbind it time based. sucks.
                setTimeout(function() {
                    window.unbindDomEvent("click", f, true);
                }, 100);

                this.focus();
                this._stopTransformation();
            },

            disableMoveSnipping: function() {
                moveSnippingEnabled = false;
                this._removeSnapLines();
            },

            enableMoveSnipping: function() {
                moveSnippingEnabled = true;
            },

            focus: function() {
                if (this.$asset) {
                    this.$asset._focus();
                }
            },

            _keyDown: function(e, mode) {

                if (e.keyCode === 16) {
                    this.set("shiftKey", true);
                }

                if (e.keyCode === 27) {
                    // esc
                    this._cancelTransformation();
                    e.preventDefault();
                }

                this.$asset.handleKeyDown && this.$asset.handleKeyDown(e);
            },

            _keyUp: function(e, mode) {
                if (e.keyCode === 16) {
                    this.set("shiftKey", false);
                }
            },

            _keyPress: function(e) {
                this.$asset.handleKeyPress && this.$asset.handleKeyPress(e);
            },

            addChar: function(c) {
                this.$asset.addChar && this.$asset.addChar(c);
            },

            _stopTransformation: function() {
                this._unbindTransformationHandler();
                this.removeClass('transforming');
                this.$.printAreaViewer.set('selected', false);
                this.set('_mode', null);
                this.$moving = false;
            },

            _unbindTransformationHandler: function() {
                var window = this.dom(this.$stage.$window);
                window.unbindDomEvent("pointermove", this.$moveHandler);
                window.unbindDomEvent("pointerup", this.$upHandler);
                window.unbindDomEvent("keydown", this.$keyDownHandler);
                window.unbindDomEvent("keyup", this.$keyUpHandler);
                this.$moveHandler = null;
                this.$upHandler = null;
            },

            _resetTransformation: function() {
                var configuration = this.$.configuration;

                if (configuration) {
                    this.set({
                        _offset: configuration.$.offset,
                        _scale: configuration.$.scale,
                        _rotation: configuration.$.rotation
                    });

                    configuration._validateTransform(configuration.$);

                    var snapLinesList = this.$.printAreaViewer.$.snapLines;
                    if (snapLinesList) {
                        snapLinesList.reset([]);
                    }
                }
            },

            _cancelTransformation: function() {
                this._resetTransformation();
                this._stopTransformation();
            },

            getMinScaleRect: function () {
                var config = this.get('configuration');

                if (!config) {
                    return null;
                }

                var minScale = config.get("minScale"),
                    printType = config.get('printType');

                var rect = this.getScaleRect(minScale);
                
                if (printType && !printType.isShrinkable()) {
                    var printTypes = config.getPossiblePrintTypes(),
                        shrinkingPrintTypePossible = _.some(printTypes, function (printType) {
                            return printType && printType.isShrinkable();
                        });

                    rect.strict = !shrinkingPrintTypePossible;
                }

                return rect;
            }.onChange("configuration.minScale", "getScaleRect()"),

            getMaxScaleRect: function () {
                var config = this.get('configuration');

                if (!config) {
                    return null;
                }

                var maxScale = config.get("maxScale"),
                    printType = config.get('printType');

                var rect = this.getScaleRect(maxScale);
                rect.strict = true;
                return rect;
            }.onChange("configuration.maxScale", "getScaleRect()", "configuration.printArea"),

            getScaleRect: function (newScale) {
                var config = this.get('configuration');

                if (!newScale) {
                    return null;
                }

                var width = this.get('_configurationWidth'),
                    height = this.get('_configurationHeight'),
                    scale = config.get('scale');

                if (!width || !height || !scale || !scale.x) {
                    return null;
                }

                return {
                    x: (width - config.width(newScale)) /2,
                    y: (height - config.height(newScale)) / 2,
                    width: config.width(newScale),
                    height: config.height(newScale)
                }
            }.onChange('_configurationWidth', '_configurationHeight'),

            getButtonSize: function(size) {
                var globalToLocalFactor = this.globalToLocalFactor();

                return {
                    width: globalToLocalFactor.x * size,
                    height: globalToLocalFactor.y * size
                };
            },

            pixelToViewBox: function(pixel) {
                return pixel * this.$._globalToLocalFactor["x"];
            }.onChange("_globalToLocalFactor"),

            scaleIconToViewBox: function() {
                return 0.1 * this.$._globalToLocalFactor["x"];
            }.onChange("_globalToLocalFactor"),

            substract: function(a, b, c) {
                return (a - (b || 0)) - (c || 0);
            },

            mul: function(value, multiplicator) {
                return value * multiplicator;
            },

            div: function (value, divider) {
                return value / divider;
            },

            half: function(value) {
                return value / 2;
            },

            flipOffsetX: function() {
                if (this.$._scale.x < 0) {
                    return -this.$.configuration.width();
                }

                return 0;
            }.onChange("_scale"),

            flipOffsetY: function() {
                if (this.$._scale.y < 0) {
                    return -this.$.configuration.height();
                }

                return 0;
            }.onChange("_scale"),

            errorClass: function() {
                return this.$._configurationValid ? "" : "error";
            }.onChange("_configurationValid"),

            isFocused: function() {
                return this.isSelectedConfiguration() && this.get('productViewer.focused');
            }.on(["productViewer", "change:selectedConfiguration"], ['productViewer', 'change:focused']),

            isSelectedConfiguration: function() {
                return this.$.configuration !== null &&
                    this.get('productViewer.editable') === true && this.get("productViewer.selectedConfiguration") === this.$.configuration
            }.on(["productViewer", "change:selectedConfiguration"]),

            isSelectedConfigurationOrConfigurationHasError: function() {
                return this.$.configuration !== null &&
                    (this.get('productViewer.editable') === true &&
                    this.get("productViewer.selectedConfiguration") === this.$.configuration) ||
                    (!this.$.configuration.isValid());
            }.on(["productViewer", "change:selectedConfiguration"], ["configuration", "isValidChanged"]),

            isScalable: function() {
                return this.isSelectedConfiguration() && this.get("configuration.isScalable()");
            }.onChange("selected"),

            isRotatable: function() {
                return this.isSelectedConfiguration() && this.get("configuration.isRotatable()");
            }.onChange("selected"),

            isMovable: function() {
                return this.isSelectedConfiguration();
            }.onChange("selected"),

            isRemovable: function() {
                return this.isSelectedConfiguration() && this.get("configuration.isRemovable()");
            }.onChange("selected"),

            isRotating: function() {
                return this.$._mode === SCALE;
            }.onChange("_mode"),

            rotates: function() {
                return this.isRotating() && !this.$._rotation.equals(this.get('configuration.rotation'));
            }.onChange('_rotation', 'isRotating()'),

            scales: function() {
                return this.isRotating() && (!this.$._scale.x.equals(this.get('configuration.scale.x')) || !this.$._scale.y.equals(this.get('configuration.scale.y')));
            }.onChange('_scale', 'isRotating()'),

            scalesAndRotates: function() {
                return this.scales() && this.rotates();
            }.onChange('scales()', 'rotates()'),

            isMoving: function() {
                return this.$._mode === MOVE;
            }.onChange("_mode"),

            isScaling: function() {
                return this.$._mode === SCALE;
            }.onChange("_mode"),

            hasError: function() {
                return !this.$.configuration.isValid() && this.get('productViewer.editable') === true;
            }.on(["configuration", "isValidChanged"]),

            errorDescription: function() {

                var error = null,
                    configuration = this.$.configuration;

                if (!(configuration && configuration.$errors)) {
                    return null;
                }

                for (var key in configuration.$errors.$) {
                    if (configuration.$errors.$.hasOwnProperty(key)) {
                        error = configuration.$errors.$[key];
                        if (error) {
                            error = key;
                            break;
                        }
                    }
                }

                if (error) {
                    return this.$.i18n.ts("configurationViewer.design", error);
                }

                return null;

            }.on(["configuration", "isValidChanged"]),

            getDistance: function(point1, point2) {
                return this.hypot(point1.$.x - point2.$.x, point1.$.y - point2.$.y);

            },

            hypot: function() {
                var y = 0;
                var length = arguments.length;

                for (var i = 0; i < length; i++) {
                    if (arguments[i] === Infinity || arguments[i] === -Infinity) {
                        return Infinity;
                    }
                    y += arguments[i] * arguments[i];
                }
                return Math.sqrt(y);
            },

            enlarge: function(val) {
                return 100 * val;
            },

            minus: function(val) {
                return -val;
            },

            radianToDegree: function(angle) {
                return angle / Math.PI * 180;
            },

            degreeToRadian: function(angle) {
                return angle / 180 * Math.PI;
            },

            degreeEqual: function(a, b) {
                return a == (b % 360);
            },

            radianEqual: function(a, b) {
                return a == (b % (2 * Math.PI));
            },

            radianDifference: function(a, b) {
                var delta = (a - b);
                return delta <= Math.PI ? delta : delta - 2 * Math.PI;
            },

            add: function(a, b) {
                var accumelator = 0;
                for (var i = 0; i < arguments.length; i++) {
                    accumelator += arguments[i];
                }

                return accumelator;
            },

            outerCircleRadius: function(configuration) {
                return Vector.distance([configuration.width() / 2, configuration.height() / 2]);
            }.onChange("configuration.scale"),

            downVectorDistance: function() {
                return this.$.downVector && this.$.downVector.distance() * (1 + this.$._scale.x - this.$.configuration.$.scale.x );
            }.onChange('_scale', 'downVector'),

            handleOffset: function() {

                var x = this.get('_configurationWidth') - this.pixelToViewBox(this.get('_handleOffset'));
                var y = this.get('_configurationHeight') - this.pixelToViewBox(this.get('_handleOffset'));
                return {
                    x: x,
                    y: y
                }
            }.onChange('_configurationWidth', '_configurationHeight', '_handleOffset'),

            handleX: function() {
                return this.handleOffset().x;
            }.onChange('handleOffset()'),

            handleY: function() {
                return this.handleOffset().y;
            }.onChange('handleOffset()'),

            className: function (a, className) {
                return a ? className : "";
            }
        });
    });
