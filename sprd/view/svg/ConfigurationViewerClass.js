define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', "sprd/view/svg/TextConfigurationRenderer", "sprd/view/svg/DesignConfigurationRenderer", "underscore"],
    function (SvgElement, TextConfiguration, DesignConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer, _) {

        var MOVE = "move",
            SCALE = "scale",
            ROTATE = "rotate";

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

                _rotation: "{configuration.rotation}"
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

                var self = this;

                if (!this.runsInBrowser()) {
                    return;
                }

                if (this.$.productViewer && this.$.productViewer.$.editable === true) {
                    var assetContainer = this.$._assetContainer,
                        scaleHandle = this.$._scaleHandle,
                        rotateHandle = this.$._rotateHandle;

                    assetContainer.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, MOVE);
                    });

                    scaleHandle && scaleHandle.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, SCALE)
                    });

                    rotateHandle && rotateHandle.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, ROTATE)
                    });

                }

            },

            unbindDomEvent: function (type, cb) {
                this.callBase();
            },

            _down: function (e, mode) {

                if (!this.runsInBrowser()) {
                    return;
                }

                if (!this.$hasTouch && e.which !== 1) {
                    // not left mouse button
                    return;
                }

                var self = this,
                    configuration = this.$.configuration,
                    factor,
                    downPoint;

                if (!configuration) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                this.$moving = true;

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
                    this.$scaleDiagonalDistance = this._getDistance({
                        x: 0,
                        y: 0
                    }, {
                        x: configuration.width() * factor.x,
                        y: configuration.height() * factor.y
                    });
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

                }

                var window = this.dom(this.$stage.$window);

                this.$moveHandler = function (e) {
                    self._move(e, mode);
                };

                this.$upHandler = function (e) {
                    self._up(e, mode);
                };

                window.bindDomEvent(this.$moveEvent, this.$moveHandler);
                window.bindDomEvent(this.$upEvent, this.$upHandler);
            },

            _getDistance: function (p1, p2) {
                var deltaX = p1.x - p2.x,
                    deltaY = p1.y - p2.y;

                return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            },

            _move: function (e, mode) {
                if (!this.$moving) {
                    return;
                }

                var configuration = this.$.configuration;
                if (!configuration) {
                    return;
                }

                var productViewer = this.$.productViewer,
                    x = this.$hasTouch ? e.changedTouches[0].pageX : e.pageX,
                    y = this.$hasTouch ? e.changedTouches[0].pageY : e.pageY,
                    factor = this.globalToLocalFactor();
                var deltaX = (this.$downPoint.x - x) ,
                    deltaY = (this.$downPoint.y - y);

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

                    var mouseDistance = this._getDistance(this.$downPoint, {
                        x: x,
                        y: y
                    });

                    if (deltaX > 0 || deltaY > 0) {
                        mouseDistance *= -1;
                    }

                    var scaleFactor = (this.$scaleDiagonalDistance + mouseDistance) / this.$scaleDiagonalDistance;

                    var scale = {
                        x: scaleFactor * configuration.$.scale.x,
                        y: scaleFactor * configuration.$.scale.y
                    };
                    this.set('_scale', scale);

                    this.set({
                        _configurationWidth: configuration.width(scale.x),
                        _configurationHeight: configuration.height(scale.y)
                    });

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

                }

                e.stopPropagation();
            },

            _up: function (e, mode) {
                if (!this.$moving) {
                    return;
                }

                var configuration = this.$.configuration;
                if (!configuration) {
                    return;
                }

                if (mode === MOVE) {
                    configuration.set('offset', this.$._offset);
                } else if (mode === SCALE) {
                    configuration.set('scale', this.$._scale);
                } else if (mode === ROTATE) {
                    configuration.set('rotation', this.$._rotation);
                }

                var window = this.dom(this.$stage.$window);
                window.unbindDomEvent(this.$moveEvent, this.$moveHandler);
                window.unbindDomEvent(this.$upEvent, this.$upHandler);

                this.$moving = false;

                this.$stage.$bus.trigger("ConfigurationModified");

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

            half: function(value) {
                return value / 2
            },

            isSelectedConfiguration: function () {
                return this.$.configuration !== null &&
                    this.get('productViewer.editable') === true && this.get("productViewer.selectedConfiguration") === this.$.configuration
            }.on(["productViewer", "change:selectedConfiguration"])

        });
    })
;