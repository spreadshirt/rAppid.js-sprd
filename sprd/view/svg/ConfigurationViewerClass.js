define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', "xaml!sprd/view/svg/TextConfigurationRenderer", "sprd/view/svg/DesignConfigurationRenderer", "underscore", "sprd/type/Vector", "js/core/I18n", "js/core/Bus"],
    function (SvgElement, TextConfiguration, DesignConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer, _, Vector, I18n, Bus) {

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
                componentClass: 'configuration-viewer',
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
                _rotationRadius: null,

                imageService: null
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

            _initializeCapabilities: function (window) {
                var runsInBrowser = this.runsInBrowser(),
                    hasTouch = runsInBrowser && ('ontouchstart' in window);

                this.$hasTouch = hasTouch;
                this.$downEvent = hasTouch ? "touchstart" : "mousedown";
                this.$moveEvent = hasTouch ? "touchmove" : "mousemove";
                this.$upEvent = hasTouch ? "touchend" : "mouseup";
                this.$clickEvent = hasTouch ? "tap" : "click";

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

                if (configuration instanceof DesignConfiguration) {
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

                    assetContainer.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : MOVE, assetContainer);
                    });

                    scaleHandle && scaleHandle.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : SCALE, scaleHandle);
                    });

                    resizeHandle && resizeHandle.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, RESIZE);
                    });

                    rotateHandle && rotateHandle.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : ROTATE, rotateHandle);
                    });

                    moveHandle && moveHandle.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : MOVE, moveHandle);
                    });


                    if (productViewer && this.$hasTouch) {
                        productViewer.bindDomEvent(this.$downEvent, function (e) {
                            if (productViewer.$.selectedConfiguration === self.$.configuration && self._isGesture(e)) {
                                self._down(e, GESTURE);
                            }
                        });
                    }

                    var preventDefault = function (e) {
                        e.preventDefault && e.preventDefault();
                        return false;
                    };

                    assetContainer.bindDomEvent(this.$clickEvent, function (e) {
                        e.stopPropagation && e.stopPropagation();
                        return false;
                    });

                    scaleHandle && scaleHandle.bindDomEvent(this.$clickEvent, preventDefault);
                    rotateHandle && rotateHandle.bindDomEvent(this.$clickEvent, preventDefault);
                    moveHandle && moveHandle.bindDomEvent(this.$clickEvent, preventDefault);

                }

            },

            _isGesture: function (e) {
                return this.$hasTouch && e.touches.length > 1;
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

                    this._debounceFunctionCall(function () {
                        configuration._setError(configuration._validateTransform({
                            offset: this.$._offset,
                            scale: this.$._scale,
                            rotation: this.$._rotation
                        }));
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
                var selected = this.$.selected;
                this.$.productViewer.set("selectedConfiguration", this.$.configuration);
                this.$stage.focus();

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
                    x: this.$hasTouch ? e.changedTouches[0].pageX : e.pageX,
                    y: this.$hasTouch ? e.changedTouches[0].pageY : e.pageY
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

                            if (this.$.productViewer && this.$.productViewer.$.product) {
                                var configurationsOnPrintArea = this.$.productViewer.$.product.getConfigurationsOnPrintAreas([printArea]) || [],
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

                    // diagonal in real px
                    this.$resizeDistanceX = downPoint.x - svgPoint.x;
                    this.$resizeDistanceY = downPoint.y - svgPoint.y;

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

                var window = this.dom(this.$stage.$window);

                this.$moveHandler = function (e) {
                    selected = true;
                    self._move(e, mode);
                };

                this.$upHandler = function (e) {
                    if (selected) {
                        self._up(e, mode);
                    } else {
                        self.$moving = false;
                    }
                };

                this.$keyDownHandler = function (e) {
                    self._keyDown(e, mode);
                };

                this.$keyUpHandler = function (e) {
                    self._keyUp(e, mode);
                };

                window.bindDomEvent(this.$moveEvent, this.$moveHandler);
                window.bindDomEvent(this.$upEvent, this.$upHandler);

                if (!this.$stage.$browser.hasTouch || this.$stage.$browser.isIOS) {
                    window.bindDomEvent("keydown", this.$keyDownHandler);
                    window.bindDomEvent("keyup", this.$keyUpHandler);
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

                var x = this.$hasTouch ? e.changedTouches[0].pageX : e.pageX,
                    y = this.$hasTouch ? e.changedTouches[0].pageY : e.pageY,
                    factor = this.globalToLocalFactor(),
                    deltaX = (this.$downPoint.x - x) ,
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

                    }

                    var snapLinesList = this.$.printAreaViewer.$.snapLines;
                    if (snapLinesList) {
                        snapLinesList.reset(snapLines);
                    }

                    this.$._offset.set({
                        x: newX,
                        y: newY
                    }, userInteractionOptions);

                } else if (mode === RESIZE) {

                    // diagonal in real px
                    currentDistance = x - this.$topLeftPoint.components[0];
                    scaleFactor = currentDistance / this.$resizeDistanceX;

                    configuration.$.textArea.set('width', this.$textArea.$.width * scaleFactor);

                    currentDistance = y - this.$topLeftPoint.components[1];
                    scaleFactor = currentDistance / this.$resizeDistanceY;
                    configuration.$.textArea.set('height', this.$textArea.$.height * scaleFactor);

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
                    if (mode === MOVE) {
                        if (configuration.$.offset && configuration.$.offset !== this.$._offset) {
                            configuration.set('offset', this.$._offset);
                        }

                        var snapLinesList = this.$.printAreaViewer.$.snapLines;
                        snapLinesList && snapLinesList.clear();

                    } else if (mode === SCALE) {
                        configuration.set({
                            scale: this.$._scale,
                            offset: this.$._offset
                        });
                    } else if (mode === ROTATE) {
                        configuration.set('rotation', this.$._rotation);
                    } else if (mode === GESTURE) {
                        configuration.set({
                            rotation: this.$._rotation,
                            scale: this.$._scale
                        });
                    }
                    this.$.bus.trigger('Application.productChanged', this.$.product);
                }

                this._stopTransformation();
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
                window.unbindDomEvent(this.$moveEvent, this.$moveHandler);
                window.unbindDomEvent(this.$upEvent, this.$upHandler);
                window.unbindDomEvent("keydown", this.$keyDownHandler);
                window.unbindDomEvent("keyup", this.$keyUpHandler);
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

            deleteConfiguration: function () {
                if (this.$.product) {
                    var configuration = this.$.configuration,
                        productViewer = this.$.productViewer;

                    this.$.product.$.configurations.remove(configuration);
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

            }.on(["configuration", "isValidChanged"])


        });
    });
