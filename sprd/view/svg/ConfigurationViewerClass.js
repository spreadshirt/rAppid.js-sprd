define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', "sprd/entity/SpecialTextConfiguration", "xaml!sprd/view/svg/TextConfigurationRenderer", "xaml!sprd/view/svg/DesignConfigurationRenderer", "xaml!sprd/view/svg/SpecialTextConfigurationRenderer", "underscore", "sprd/type/Vector", "js/core/I18n", "js/core/Bus", "sprd/util/UnitUtil", "sprd/entity/BendingTextConfiguration", "xaml!sprd/view/svg/BendingTextConfigurationRenderer"],
    function (SvgElement, TextConfiguration, DesignConfiguration, SpecialTextConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer, SpecialTextConfigurationRenderer, _, Vector, I18n, Bus, UnitUtil, BendingTextConfiguration, BendingTextConfigurationRenderer) {

        var MOVE = "move",
            SCALE = "scale",
            RESIZE = "resize",
            ROTATE = "rotate",
            GESTURE = "gesture";

        var validateConfigurationOnTransform = true,
            rotationSnippingAngle = 45,
            rotationSnippingThreshold = 5,
            rotateSnippingEnabled = true,
            moveSnippingEnabled = true,
            moveSnippingThreshold = 7,
            enableGestures = false;

        return SvgElement.inherit({

            defaults: {
                tagName: 'g',
                componentClass: 'configuration-viewer printType-{configuration.printType.id}',
                configuration: null,

                translateX: "{_offset.x}",
                translateY: "{_offset.y}",

                rotation: "{_rotation}",
                rotationX: "{half(configuration.width(_scale.x))}",
                rotationY: "{half(configuration.height(_scale.y))}",

                _assetContainer: null,
                _scaleHandle: null,
                _deleteHandle: null,
                _rotateHandle: null,
                _resizeHandle: null,

                productViewer: null,
                printAreaViewer: null,
                product: null,

                // tmp. offset during move
                _offset: "{configuration.offset}",
                _scale: "{configuration.scale}",

                _configurationWidth: "{configuration.width()}",
                _configurationHeight: "{configuration.height()}",

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
                preventValidation: false
            },

            inject: {
                i18n: I18n,
                bus: Bus
            },

            $classAttributes: ["configuration", "product", "printAreaViewer", "assetContainer", "productViewer", "clipPath", "imageService"],

            ctor: function () {

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

                this.bind('productViewer', 'change:width', this._productViewerSizeChanged, this);
                this.bind(["productViewer", "change:selectedConfiguration"], function () {
                    if (this.isSelectedConfiguration()) {
                        this.focus();
                    }
                }, this);
            },

            _initializationComplete: function () {

                var clipPath = this.$.clipPath;
                var transformations = clipPath.$.transformations;

                transformations.unshift(transformations.removeAt(1));

                this.callBase();
            },

            id: function () {
                return "c" + this.$cid;
            },

            invert: function (value) {
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

            formatSize: function(size) {
                if (size != null) {
                    return parseInt(size).toFixed(0);
                }
                return size;
            },

            _initializeCapabilities: function (window) {
                var runsInBrowser = this.runsInBrowser(),
                    hasTouch = runsInBrowser && ('ontouchstart' in window);

                this.$hasTouch = hasTouch;

                if (hasTouch) {
                    this.set({
                        _handleWidth: 28,
                        _handleOffset: 0,
                        "_handle-Offset": -28,
                        _handleIconScale: 1.6
                    });
                }
            },

            _renderFocused: function (focused) {
                if (focused) {
                    this.addClass('focused');
                } else {
                    this.removeClass('focused');
                }

            },

            _initializeRenderer: function () {

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

            _bindDomEvents: function () {
                this.callBase();

                var self = this,
                    productViewer = this.$.productViewer;

                if (!this.runsInBrowser()) {
                    return;
                }

                if (productViewer && productViewer.$.editable === true) {
                    var assetContainer = this.$._assetContainer,
                        scaleHandle = this.$._scaleHandle,
                        resizeHandle = this.$._resizeHandle,
                        rotateHandle = this.$._rotateHandle,
                        moveHandle = this.$._moveHandle;


                    assetContainer.bindDomEvent("click", function () {
                        self._showKeyBoard();
                    });

                    assetContainer.bindDomEvent("pointerdown", function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : MOVE);
                    });

                    scaleHandle && scaleHandle.bindDomEvent("pointerdown", function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : SCALE, scaleHandle);
                    });

                    resizeHandle && resizeHandle.bindDomEvent("pointerdown", function (e) {
                        self._down(e, RESIZE);
                    });

                    rotateHandle && rotateHandle.bindDomEvent("pointerdown", function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : ROTATE, rotateHandle);
                    });

                    moveHandle && moveHandle.bindDomEvent("pointerdown", function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : MOVE, moveHandle);
                    });


                    if (productViewer && this.$hasTouch) {
                        productViewer.bindDomEvent("pointerdown", function (e) {
                            if (productViewer.$.selectedConfiguration === self.$.configuration && self._isGesture(e)) {
                                self._down(e, GESTURE);
                            }
                        });
                    }

                    var preventDefault = function (e) {
                        e.preventDefault && e.preventDefault();
                        return false;
                    };

                    assetContainer.bindDomEvent("click", function (e) {
                        e.stopPropagation && e.stopPropagation();
                        return false;
                    });

                    scaleHandle && scaleHandle.bindDomEvent("click", preventDefault);
                    rotateHandle && rotateHandle.bindDomEvent("click", preventDefault);
                    moveHandle && moveHandle.bindDomEvent("click", preventDefault);

                }

            },

            _isGesture: function (e) {
                return e.touches && e.touches.length > 1;
            },

            _productViewerSizeChanged: function () {
                this.set('_globalToLocalFactor', this.$.productViewer.globalToLocalFactor());
            },

            _showKeyBoard: function () {

                var parent = this.$.productViewer.$parent;

                if (parent) {
                    if (this.$wasSelected) {
                        var textArea = parent.$.textArea;
                        if (textArea && textArea.$el) {
                            // bring up the keyboard in ios
                            textArea.$el.focus();

                        }
                    } else {
                        this.$wasSelected = true;
                    }
                }
            },

            _transformationChanged: function () {

                var configuration = this.$.configuration;
                if (configuration) {

                    var self = this;
                    this._debounceFunctionCall(function () {
                        if (!self.$.preventValidation) {
                            configuration._setError(configuration._validateTransform({
                                offset: this.$._offset,
                                scale: this.$._scale,
                                rotation: this.$._rotation
                            }));
                        }
                    }, "transformationChanged");
                }
            },

            _commitSelected: function () {
                this.$wasSelected = false;
            },

            _down: function (e, mode, initiator) {

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

                if (mode === GESTURE && !enableGestures) {
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

                if (this.$stage.$browser.isMobile && configuration instanceof TextConfiguration) {
                    var cursorIndex;
                    if (configuration.$.textFlow) {
                        cursorIndex = configuration.$.textFlow.textLength() - 1;
                    } else {
                        cursorIndex = 0;
                    }
                    configuration.$.selection.set({
                        activeIndex: cursorIndex,
                        anchorIndex: cursorIndex
                    });
                }
                var selected = this.$.selected,
                    productViewer = this.$.productViewer,
                    previousSelectedConfiguration = this.$.productViewer.$.selectedConfiguration;

                productViewer.set("selectedConfiguration", this.$.configuration);
                this.$.bus.trigger('ConfigurationViewer.configurationSelected', {
                    configuration: configuration
                });

//                this.$stage.focus();

                if (e.defaultPrevented) {
                    return;
                }

                e.preventDefault && e.preventDefault();

                this.$moving = true;
                this.set({
                    "_mode": mode,
                    shiftKey: false
                });

                downPoint = this.$downPoint = {
                    x: e.changedTouches ? e.changedTouches[0].pageX : e.pageX,
                    y: e.changedTouches ? e.changedTouches[0].pageY : e.pageY
                };

                var downVector = new Vector([downPoint.x, downPoint.y]);

                factor = this.localToGlobalFactor();
                var halfWidth = (configuration.width() / 2) * factor.x,
                    halfHeight = (configuration.height() / 2) * factor.y,
                    svgRoot = this.getSvgRoot(),
                    svgPoint = svgRoot.$el.createSVGPoint(),
                    matrix = this.$el.getScreenCTM();

                // center point in svg coordinates
                svgPoint.x = configuration.width() / 2;
                svgPoint.y = configuration.height() / 2;

                svgPoint = svgPoint.matrixTransform(matrix);

                this.$centerPoint = new Vector([svgPoint.x, svgPoint.y]);

                if (mode === MOVE) {

                    this.$snapPoints = [];

                    if (moveSnippingEnabled) {

                        var printArea = configuration.$.printArea;

                        if (printArea) {

                            var x,
                                y,
                                height,
                                width;

                            if (productViewer && productViewer.$.product) {
                                var configurationsOnPrintArea = productViewer.$.product.getConfigurationsOnPrintAreas([printArea]) || [],
                                    myIndex = _.indexOf(configurationsOnPrintArea, configuration);

                                if (myIndex !== -1) {
                                    configurationsOnPrintArea.splice(myIndex, 1);
                                }

                                for (var i = 0; i < configurationsOnPrintArea.length; i++) {
                                    var otherConfiguration = configurationsOnPrintArea[i];

                                    x = otherConfiguration.$.offset.$.x;
                                    y = otherConfiguration.$.offset.$.y;
                                    height = otherConfiguration.height();
                                    width = otherConfiguration.width();

                                    this.$snapPoints.push({
                                        x: x,
                                        y: y
                                    }, {
                                        x: x + width / 2,
                                        y: y + height / 2
                                    }, {
                                        x: x + width,
                                        y: y + height
                                    });
                                }
                            }

                            width = printArea.width();
                            height = printArea.height();

                            this.$snapPoints.push({
                                x: 0,
                                y: 0
                            }, {
                                x: width / 2,
                                y: height / 2
                            }, {
                                x: width,
                                y: height
                            });

                        }

                    }

                    this.set('_offset', configuration.$.offset.clone());
                } else if (mode === RESIZE) {

                    this.$textArea = configuration.$.textArea.clone();

                    svgPoint.x = 0;
                    svgPoint.y = 0;
                    svgPoint = svgPoint.matrixTransform(matrix);

                    this.$topLeftPoint = new Vector([svgPoint.x, svgPoint.y]);

                    var rot = -this.$._rotation * Math.PI / 180,
                        sin = Math.sin(rot),
                        cos = Math.cos(rot);

                    var distanceX = downPoint.x - svgPoint.x,
                        distanceY = downPoint.y - svgPoint.y;
                    // diagonal in real px
                    this.$resizeDistanceX = distanceX * cos - sin * distanceY;
                    this.$resizeDistanceY = distanceX * sin + cos * distanceY;

                } else if (mode === SCALE) {

                    this.set({
                        _scale: _.clone(configuration.$.scale),
                        _offset: configuration.$.offset.clone()
                    });

                    var scaleVector = downVector.subtract(this.$centerPoint);

                    // diagonal in real px
                    this.$scaleDiagonalDistance = scaleVector.distance();
                } else if (mode === ROTATE) {

                    this.$startRotateVector = downVector.subtract(this.$centerPoint);
                    this.set("_rotationRadius", Vector.distance([halfHeight, halfWidth]) / factor.x);

                } else if (mode === GESTURE) {
                    // gesture -> start from beginning

                    this._resetTransformation();

                    this.set('_offset', configuration.$.offset.clone());

                    var firstFinger = e.touches[0],
                        secondFinger = e.touches[1];

                    var first = new Vector([firstFinger.pageX, firstFinger.pageY]);
                    var second = new Vector([secondFinger.pageX, secondFinger.pageY]);
                    var initialVector = second.subtract(first);

                    this.$downPoints = [first, second];

                    this.$downVector = initialVector;
                    this.$rotatePoint = initialVector.multiply(0.5);
                    this.$scaleDiagonalDistance = initialVector.distance();

                }
                var $w = this.$stage.$window;
                this.$window = this.$window || this.dom($w);

                var window = this.$window;

                // shim layer with setTimeout fallback
                $w.requestAnimFrame = $w.$requestAnimFrame || (function () {
                    return $w.requestAnimationFrame ||
                        $w.webkitRequestAnimationFrame ||
                        $w.mozRequestAnimationFrame ||
                        function (callback) {
                            $w.setTimeout(callback, 1000 / 60);
                        };
                })();

                this.$requestAnimCallback = this.$requestAnimCallback || function () {
                    self._callMove();
                };

                this.$moveHandler = function (e) {
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

                this.$upHandler = function (e) {
                    var distance = self.getDistance(configuration.$.offset, self.$._offset);
                    var onlyPointed = !(distance) && mode === MOVE && !self.$moveInitiator;

                    if(onlyPointed && configuration == previousSelectedConfiguration && (configuration instanceof TextConfiguration || configuration instanceof SpecialTextConfiguration || configuration instanceof  BendingTextConfiguration)) {
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

                this.$keyDownHandler = function (e) {
                    self._keyDown(e, mode);
                };

                this.$keyUpHandler = function (e) {
                    self._keyUp(e, mode);
                };

                window.bindDomEvent("pointermove", this.$moveHandler);
                window.bindDomEvent("pointerup", this.$upHandler);


                if (!this.$stage.$browser.hasTouch || this.$stage.$browser.isIOS) {
                    window.bindDomEvent("keydown", this.$keyDownHandler);
                    window.bindDomEvent("keyup", this.$keyUpHandler);
                }

            },

            _beforeDestroy: function () {
                this.callBase();

                var snapLines = this.$.printAreaViewer.$.snapLines;
                snapLines && snapLines.clear();

                var $w = this.$stage.$window;
                this.$window = this.$window || this.dom($w);

                var window = this.$window;

                window.unbindDomEvent("pointermove", this.$moveHandler);
                window.unbindDomEvent("pointerup", this.$upHandler);

            },

            _callMove: function () {
                if (this.$moveState && this.$moveState.active) {
                    this.$moveState.active = false;
                    this._move(this.$moveState.e, this.$moveState.mode);
                }
                if (this.$moving && this.$window) {
                    this.$window.bindDomEvent("pointermove", this.$moveHandler);
                }
            },

            _move: function (e, mode) {

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
                    distanceX, distanceY;

                this.set('_configurationInfo', true);

                if (mode === MOVE) {
                    var newX = configuration.$.offset.$.x - deltaX * factor.x,
                        newY = configuration.$.offset.$.y - deltaY * factor.y,
                        snapX = Math.max(), snapY = Math.max(),
                        posX, posY, snapPosX, snapPosY;

                    if (moveSnippingEnabled) {

                        var snapLines = [],
                            threshold = moveSnippingThreshold * factor.x;

                        if (!this.$.shiftKey) { // check if there is something to snap in the near
                            for (var positionFactor = 0; positionFactor <= 2; positionFactor++) {
                                posX = newX + positionFactor / 2 * configuration.width();
                                posY = newY + positionFactor / 2 * configuration.height();

                                for (var p = 0; p < this.$snapPoints.length; p++) {
                                    var snapPoint = this.$snapPoints[p];

                                    distanceX = posX - snapPoint.x;
                                    distanceY = posY - snapPoint.y;

                                    if (Math.abs(distanceX) <= threshold && Math.abs(distanceX) < Math.abs(snapX)) {
                                        // snap to point
                                        snapX = distanceX;
                                        snapPosX = snapPoint.x;
                                    }

                                    if (Math.abs(distanceY) <= threshold && Math.abs(distanceY) < Math.abs(snapY)) {
                                        snapY = distanceY;
                                        snapPosY = snapPoint.y;
                                    }

                                }
                            }

                            if (Math.abs(snapX) <= threshold) {
                                newX -= snapX;
                                snapLines.push({
                                    x1: snapPosX,
                                    x2: snapPosX,
                                    y1: -2000,
                                    y2: 2000
                                });
                            }

                            if (Math.abs(snapY) <= threshold) {
                                newY -= snapY;
                                snapLines.push({
                                    y1: snapPosY,
                                    y2: snapPosY,
                                    x1: -2000,
                                    x2: 2000
                                });
                            }
                        }
                        var snapLinesList = this.$.printAreaViewer.$.snapLines;
                        if (snapLinesList) {
                            snapLinesList.reset(snapLines);
                        }
                    }


                    this.$._offset.set({
                        x: newX,
                        y: newY
                    }, userInteractionOptions);

                } else if (mode === RESIZE) {
                    var rot = -this.$._rotation * Math.PI / 180,
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

                    rot = this.$._rotation * Math.PI / 180;
                    sin = Math.sin(rot);
                    cos = Math.cos(rot);

                    var vX = (cos * widthDiff - sin * heightDiff) * 0.5;
                    var vY = (sin * widthDiff + cos * heightDiff) * 0.5;


                    configuration.$.offset.set('x', configuration.$.offset.$.x + (vX - widthDiff * 0.5) * configuration.$.scale.x);
                    configuration.$.offset.set('y', configuration.$.offset.$.y + (vY - heightDiff * 0.5) * configuration.$.scale.y);

                    configuration._debouncedComposeText();

                    configuration.trigger("sizeChanged");

                } else if (mode === SCALE) {

                    downVector = new Vector([x, y]);
                    currentVector = downVector.subtract(this.$centerPoint);
                    currentDistance = currentVector.distance();

                    scaleFactor = currentDistance / this.$scaleDiagonalDistance;

                    var scale = {
                        x: scaleFactor * configuration.$.scale.x,
                        y: scaleFactor * configuration.$.scale.y
                    };

                    var offsetX = configuration.$.offset.$.x;
                    var offsetY = configuration.$.offset.$.y;

                    newConfigurationWidth = configuration.width(scale.x);
                    newConfigurationHeight = configuration.height(scale.y);
                    var configurationWidth = configuration.width();
                    var configurationHeight = configuration.height();

                    this.set('_scale', scale, userInteractionOptions);

                    this.$._offset.set({
                        x: offsetX + (configurationWidth - newConfigurationWidth) / 2,
                        y: offsetY + (configurationHeight - newConfigurationHeight) / 2
                    }, userInteractionOptions);

                    self.set({
                        _configurationWidth: newConfigurationWidth,
                        _configurationHeight: newConfigurationHeight
                    }, userInteractionOptions);

                } else if (mode === ROTATE) {
                    var startVector = this.$startRotateVector;

                    currentVector = Vector.subtract([x, y], this.$centerPoint);

                    var scalarProduct = Vector.scalarProduct(startVector, currentVector);
                    var rotateAngle = Math.acos(scalarProduct / (startVector.distance() * currentVector.distance())) * 180 / Math.PI;

                    var crossVector = Vector.vectorProduct(startVector, currentVector);

                    if (crossVector.components[2] < 0) {
                        rotateAngle *= -1;
                    }

                    rotateAngle = Math.round(configuration.$.rotation + rotateAngle, 2);

                    if (rotateSnippingEnabled && !this.$.shiftKey) {
                        if (rotateAngle < 0) {
                            rotateAngle += 360;
                        }

                        rotateAngle %= 360;

                        if (rotateAngle % rotationSnippingAngle < rotationSnippingThreshold) {
                            rotateAngle = Math.floor(rotateAngle / rotationSnippingAngle) * rotationSnippingAngle;
                        } else if (rotationSnippingAngle - rotateAngle % rotationSnippingAngle < rotationSnippingThreshold) {
                            rotateAngle = (Math.floor(rotateAngle / rotationSnippingAngle) + 1) * rotationSnippingAngle
                        }

                    }

                    this.set("_rotation", rotateAngle, userInteractionOptions);

                } else if (mode === GESTURE) {

                    var firstFinger = e.touches[0],
                        secondFinger = e.touches[1];

                    var first = new Vector([firstFinger.pageX, firstFinger.pageY]);
                    var second = new Vector([secondFinger.pageX, secondFinger.pageY]);

                    var vector = second.subtract(first);
                    var angle = Math.acos(Vector.scalarProduct(vector, this.$downVector) / (this.$downVector.distance() * vector.distance())) * 180 / Math.PI;
                    if (this.$downVector[0] * vector[1] - this.$downVector[1] * vector[0] < 0) {
                        console.log("reverse");
                        angle *= -1;
                    }

                    var movement = vector.multiply(0.5).subtract(this.$rotatePoint);

                    console.log(movement.components, this.$._offset, configuration.$.offset);

                    this.$._offset.set({
                        x: configuration.$.offset.$.x - movement.components[0],
                        y: configuration.$.offset.$.y - movement.components[1]
                    });

                    this.set("_rotation", Math.round(configuration.$.rotation + angle, 2));

                    scaleWithFactor(second.subtract(first).distance() / this.$scaleDiagonalDistance);
                }

                function scaleWithFactor(scaleFactor) {

                    var scale = {
                        x: scaleFactor * configuration.$.scale.x,
                        y: scaleFactor * configuration.$.scale.y
                    };

                    self.set('_scale', scale);

                    self.set({
                        _configurationWidth: configuration.width(scale.x),
                        _configurationHeight: configuration.height(scale.y)
                    });
                }


            },

            _up: function (e, mode) {
                if (!this.$moving) {
                    return;
                }

                var configuration = this.$.configuration;
                if (configuration) {
                    var changed = false;
                    if (mode === MOVE) {
                        if (configuration.$.offset && configuration.$.offset !== this.$._offset) {
                            configuration.set('offset', this.$._offset);
                            changed = true;

                        }

                        var snapLinesList = this.$.printAreaViewer.$.snapLines;
                        snapLinesList && snapLinesList.clear();

                    } else if (mode === SCALE) {
                        changed = configuration.$.offset !== this.$._offset && configuration.$.scale !== this.$._scale;
                        configuration.set({
                            scale: this.$._scale,
                            offset: this.$._offset
                        });
                    } else if (mode === ROTATE) {
                        changed = configuration.$.rotation !== this.$._rotation;
                        configuration.set('rotation', this.$._rotation);

                    } else if (mode === GESTURE) {
                        changed = configuration.$.rotation !== this.$._rotation && configuration.$.scale !== this.$._scale;
                        configuration.set({
                            rotation: this.$._rotation,
                            scale: this.$._scale
                        });
                    }

                    if (changed) {
                        this.$.bus.trigger('Application.productChanged', this.$.product);
                    }
                }


                var window = this.dom(this.$stage.$window),
                    f = function (e) {
                        // capture phase event to prevent click
                        // which closes menus etc.
                        e.stopPropagation();
                        window.unbindDomEvent("click", f, true);
                    };

                window.bindDomEvent("click", f, true);

                // chrome does it right and dispatches a click, but
                // the mobile devices and also ff, safari needs to unbind it time based. sucks.
                setTimeout(function () {
                    window.unbindDomEvent("click", f, true);
                }, 100);

                this.focus();
                this._stopTransformation();
            },

            disableMoveSnipping: function () {
                moveSnippingEnabled = false;
                var snapLines = this.get('printAreaViewer.snapLines');
                snapLines && snapLines.clear();
            },

            enableMoveSnipping: function () {
                moveSnippingEnabled = true;
            },

            focus: function () {
                if (this.$asset) {
                    this.$asset._focus();
                }
            },

            _keyDown: function (e, mode) {

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

            _keyUp: function (e, mode) {
                if (e.keyCode === 16) {
                    this.set("shiftKey", false);
                }
            },

            _keyPress: function (e) {
                this.$asset.handleKeyPress && this.$asset.handleKeyPress(e);
            },

            addChar: function (c) {
                this.$asset.addChar && this.$asset.addChar(c);
            },

            _stopTransformation: function () {

                this._unbindTransformationHandler();

                this.set('_mode', null);
                this.$moving = false;
            },

            _unbindTransformationHandler: function () {
                var window = this.dom(this.$stage.$window);
                window.unbindDomEvent("pointermove", this.$moveHandler);
                window.unbindDomEvent("pointerup", this.$upHandler);
                window.unbindDomEvent("keydown", this.$keyDownHandler);
                window.unbindDomEvent("keyup", this.$keyUpHandler);
                this.$moveHandler = null;
                this.$upHandler = null;
            },

            _resetTransformation: function () {
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

            _cancelTransformation: function () {

                this._resetTransformation();
                this._stopTransformation();

            },

            getButtonSize: function (size) {
                var globalToLocalFactor = this.globalToLocalFactor();

                return {
                    width: globalToLocalFactor.x * size,
                    height: globalToLocalFactor.y * size
                };
            },

            pixelToViewBox: function (pixel) {
                return pixel * this.$._globalToLocalFactor["x"];
            }.onChange("_globalToLocalFactor"),

            scaleIconToViewBox: function () {
                return 0.1 * this.$._globalToLocalFactor["x"];
            }.onChange("_globalToLocalFactor"),

            deleteConfiguration: function (e) {

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


            substract: function (value, minuend) {
                return value - minuend;
            },

            mul: function (value, multiplicator) {
                return value * multiplicator;
            },

            half: function (value) {
                return value / 2;
            },

            flipOffsetX: function () {
                if (this.$._scale.x < 0) {
                    return -this.$.configuration.width();
                }

                return 0;
            }.onChange("_scale"),

            flipOffsetY: function () {
                if (this.$._scale.y < 0) {
                    return -this.$.configuration.height();
                }

                return 0;
            }.onChange("_scale"),

            errorClass: function () {
                return this.$._configurationValid ? "" : "error";
            }.onChange("_configurationValid"),

            isFocused: function () {
                return this.isSelectedConfiguration() && this.get('productViewer.focused');
            }.on(["productViewer", "change:selectedConfiguration"], ['productViewer', 'change:focused']),

            isSelectedConfiguration: function () {
                return this.$.configuration !== null &&
                    this.get('productViewer.editable') === true && this.get("productViewer.selectedConfiguration") === this.$.configuration
            }.on(["productViewer", "change:selectedConfiguration"]),

            isSelectedConfigurationOrConfigurationHasError: function () {
                return this.$.configuration !== null &&
                    (this.get('productViewer.editable') === true &&
                    this.get("productViewer.selectedConfiguration") === this.$.configuration) ||
                    (!this.$.configuration.isValid());
            }.on(["productViewer", "change:selectedConfiguration"], ["configuration", "isValidChanged"]),

            isScalable: function () {
                return this.isSelectedConfiguration() && this.get("configuration.isScalable()");
            }.onChange("selected"),

            isResizeable: function () {
                return this.isSelectedConfiguration() && this.get("configuration.type") === "text";
            }.onChange("selected"),

            isRotatable: function () {
                return this.isSelectedConfiguration() && this.get("configuration.isRotatable()");
            }.onChange("selected"),

            isMovable: function () {
                return this.isSelectedConfiguration();
            }.onChange("selected"),

            isRemovable: function () {
                return this.isSelectedConfiguration() && this.get("configuration.isRemovable()");
            }.onChange("selected"),

            isRotating: function () {
                return this.$._mode === ROTATE;
            }.onChange("_mode"),

            isMoving: function() {
                return this.$._mode === MOVE;
            }.onChange("_mode"),

            isScaling: function() {
                return this.$._mode === SCALE;
            }.onChange("_mode"),

            hasError: function () {
                return !this.$.configuration.isValid() && this.get('productViewer.editable') === true;
            }.on(["configuration", "isValidChanged"]),

            errorDescription: function () {

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
            }


        });
    });
