define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', "sprd/view/svg/TextConfigurationRenderer", "sprd/view/svg/DesignConfigurationRenderer", "underscore", "sprd/type/Vector"],
    function (SvgElement, TextConfiguration, DesignConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer, _, Vector) {

        var MOVE = "move",
            SCALE = "scale",
            ROTATE = "rotate",
            GESTURE = "gesture";

        return SvgElement.inherit({

            defaults: {
                tagName: 'g',
                componentClass: 'configuration-viewer',
                configuration: null,

                translateX: "{_offset.x}",
                translateY: "{_offset.y}",

                rotation: "{_rotation}",
                rotationX: "{half(configuration.width())}",
                rotationY: "{half(configuration.height())}",

                _assetContainer: null,
                _scaleHandle: null,
                _deleteHandle: null,
                _rotateHandle: null,

                productViewer: null,
                printAreaViewer: null,
                product: null,

                // tmp. offset during move
                _offset: "{configuration.offset}",
                _scale: "{configuration.scale}",

                _configurationWidth: "{configuration.width()}",
                _configurationHeight: "{configuration.height()}",

                _rotation: "{configuration.rotation}",

                _configurationValid: "{configuration.isValid()}"
            },

            $classAttributes: ["configuration", "product", "printAreaViewer", "assetContainer", "productViewer"],

            ctor: function () {

                this.callBase();

                // this brings the translate transformation before the rotate transformation
                this.translate(0, 0);
                this.rotate(0, 0, 0);

                this._initializeCapabilities(this.$stage.$window);
            },

            _initializeCapabilities: function (window) {
                var runsInBrowser = this.runsInBrowser(),
                    hasTouch = runsInBrowser && ('ontouchstart' in window);

                this.$hasTouch = hasTouch;
                this.$downEvent = hasTouch ? "touchstart" : "mousedown";
                this.$moveEvent = hasTouch ? "touchmove" : "mousemove";
                this.$upEvent = hasTouch ? "touchend" : "mouseup";
                this.$clickEvent = hasTouch ? "tap" : "click";
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
                        configuration: configuration
                    });

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
                        rotateHandle = this.$._rotateHandle;

                    assetContainer.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : MOVE);
                    });

                    scaleHandle && scaleHandle.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : SCALE)
                    });

                    rotateHandle && rotateHandle.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, self._isGesture(e) ? GESTURE : ROTATE)
                    });


                    if (productViewer && this.$hasTouch) {
                        productViewer.bindDomEvent(this.$downEvent, function (e) {
                            if (productViewer.$.selectedConfiguration === self.$.configuration && self._isGesture(e)) {
                                self._down(e, GESTURE);
                            }
                        });
                    }

                    var stopPropagation = function (e) {
                        e.stopPropagation();
                    };

                    assetContainer.bindDomEvent(this.$clickEvent, stopPropagation);
                    scaleHandle && scaleHandle.bindDomEvent(this.$clickEvent, stopPropagation);
                    rotateHandle && rotateHandle.bindDomEvent(this.$clickEvent, stopPropagation);

                }

            },

            _isGesture: function (e) {
                return this.$hasTouch && e.touches.length > 1;
            },

            unbindDomEvent: function (type, cb) {
                this.callBase();
            },

            _down: function (e, mode) {

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

                // there is a current action and another down -> gesture
                if (this.$mode !== null) {
                    // unbind the current handler
                    this._unbindTransformationHandler();
                }

                e.preventDefault();
                e.stopPropagation();

                this.$moving = true;
                this.$mode = mode;

                downPoint = this.$downPoint = {
                    x: this.$hasTouch ? e.changedTouches[0].pageX : e.pageX,
                    y: this.$hasTouch ? e.changedTouches[0].pageY : e.pageY
                };

                if (mode === MOVE) {
                    this.$.productViewer.set("selectedConfiguration", this.$.configuration);
                    this.set('_offset', configuration.$.offset.clone());
                } else if (mode === SCALE) {

                    factor = this.localToGlobalFactor();
                    this.set('_scale', _.clone(configuration.$.scale));

                    // diagonal in real px
                    this.$scaleDiagonalDistance = Vector.distance([configuration.width() * factor.x, configuration.height() * factor.y]);
                } else if (mode === ROTATE) {
                    factor = this.localToGlobalFactor();
                    var halfWidth = (configuration.width() / 2) * factor.x,
                        halfHeight = (configuration.height() / 2) * factor.y;

                    this.$centerPoint = {
                        x: downPoint.x - halfWidth,
                        y: downPoint.y + halfHeight
                    };

                    this.$startRotateVector = {
                        x: halfWidth,
                        y: -halfHeight
                    };

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
                    self._move(e, mode);
                };

                this.$upHandler = function (e) {
                    self._up(e, mode);
                };

                this.$keyDownHandler = function (e) {
                    self._keyDown(e, mode);
                };

                window.bindDomEvent(this.$moveEvent, this.$moveHandler);
                window.bindDomEvent(this.$upEvent, this.$upHandler);
                window.bindDomEvent("keydown", this.$keyDownHandler);

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

                var productViewer = this.$.productViewer,
                    x = this.$hasTouch ? e.changedTouches[0].pageX : e.pageX,
                    y = this.$hasTouch ? e.changedTouches[0].pageY : e.pageY,
                    factor = this.globalToLocalFactor(),
                    deltaX = (this.$downPoint.x - x) ,
                    deltaY = (this.$downPoint.y - y);

                var scaleFactor;

                if (mode === MOVE) {
                    this.$._offset.set({
                        x: configuration.$.offset.$.x - deltaX * factor.x,
                        y: configuration.$.offset.$.y - deltaY * factor.y
                    });
                } else if (mode === SCALE) {
                    var aspectRatio = configuration.width() / configuration.height();

                    if (deltaX >= deltaY) {
                        y = this.$downPoint.y + deltaX / aspectRatio;
                    } else {
                        x = this.$downPoint.x + deltaY / aspectRatio;
                    }

                    var mouseDistance = Vector.distance([this.$downPoint.x - x, this.$downPoint.y - y]);

                    if (deltaX > 0 || deltaY > 0) {
                        mouseDistance *= -1;
                    }

                    scaleFactor = (this.$scaleDiagonalDistance + mouseDistance) / this.$scaleDiagonalDistance;

                    scaleWithFactor(scaleFactor);

                } else if (mode === ROTATE) {
                    var startVector = this.$startRotateVector;
                    var currentVector = {
                        x: x - this.$centerPoint.x,
                        y: y - this.$centerPoint.y
                    };

                    var scalarProduct = startVector.x * currentVector.x + startVector.y * currentVector.y;
                    var distanceCenterPoint = Math.sqrt(startVector.x * startVector.x + startVector.y * startVector.y);
                    var distanceCurrentPoint = Math.sqrt(currentVector.x * currentVector.x + currentVector.y * currentVector.y);

                    var angle = Math.acos(scalarProduct / (distanceCenterPoint * distanceCurrentPoint)) * 180 / Math.PI;

                    var crossProduct = startVector.x * currentVector.y - startVector.y * currentVector.x;
                    if (crossProduct < 0) {
                        angle *= -1;
                    }

                    this.set("_rotation", Math.round(configuration.$.rotation + angle, 2));

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
                        configuration.set('offset', this.$._offset);
                    } else if (mode === SCALE) {
                        configuration.set('scale', this.$._scale);
                    } else if (mode === ROTATE) {
                        configuration.set('rotation', this.$._rotation);
                    } else if (mode === GESTURE) {
                        configuration.set({
                            rotation: this.$._rotation,
                            scale: this.$._scale
                        });
                    }
                }

                this._stopTransformation();
            },

            _keyDown: function (e, mode) {

                if (e.keyCode === 27) {
                    // esc
                    this._cancelTransformation();
                    e.preventDefault();
                }

            },

            _stopTransformation: function () {

                this._unbindTransformationHandler();

                this.$mode = null;
                this.$moving = false;
            },

            _unbindTransformationHandler: function () {
                var window = this.dom(this.$stage.$window);
                window.unbindDomEvent(this.$moveEvent, this.$moveHandler);
                window.unbindDomEvent(this.$upEvent, this.$upHandler);
                window.unbindDomEvent("keydown", this.$keyDownHandler);
            },

            _resetTransformation: function () {
                var configuration = this.$.configuration;

                if (configuration) {
                    this.set({
                        _offset: configuration.$.offset,
                        _scale: configuration.$.scale,
                        _rotation: configuration.$.rotation
                    });
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
                }
            },

            deleteConfiguration: function () {
                if (this.$.product) {
                    var configuration = this.$.configuration,
                        productViewer = this.$.productViewer;

                    this.$.product.$.configurations.remove(configuration);

                    if (productViewer && productViewer.$.selectedConfiguration === configuration) {
                        productViewer.set('selectedConfiguration', null);
                    }

                }
            },


            substract: function (value, minuend) {
                return value - minuend;
            },

            half: function (value) {
                return value / 2
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

            errorClass: function() {
                return this.$._configurationValid ? "" : "error";
            }.onChange("_configurationValid"),

            isSelectedConfiguration: function () {
                return this.$.configuration !== null &&
                    this.get('productViewer.editable') === true && this.get("productViewer.selectedConfiguration") === this.$.configuration
            }.on(["productViewer", "change:selectedConfiguration"]),

            isScalable: function () {
                return this.isSelectedConfiguration() && this.get("configuration.isScalable()");
            }.on(["productViewer", "change:selectedConfiguration"]),

            isRotatable: function () {
                return this.isSelectedConfiguration() && this.get("configuration.isRotatable()");
            }.on(["productViewer", "change:selectedConfiguration"]),

            isRemovable: function () {
                return this.isSelectedConfiguration() && this.get("configuration.isRemovable()");
            }.on(["productViewer", "change:selectedConfiguration"])

        });
    })
;