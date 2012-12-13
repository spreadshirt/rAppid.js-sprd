define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', "sprd/view/svg/TextConfigurationRenderer", "sprd/view/svg/DesignConfigurationRenderer", "underscore"],
    function (SvgElement, TextConfiguration, DesignConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer, _) {

        var MOVE = "move",
            SCALE = "scale";

        return SvgElement.inherit({

            defaults: {
                tagName: 'g',
                componentClass: 'configuration-viewer',
                configuration: null,

                translateX: "{configuration.offset.x}",
                translateY: "{configuration.offset.y}",

                _assetContainer: null,
                _scaleHandle: null,

                productViewer: null,
                printAreaViewer: null
            },

            $classAttributes: ["configuration", "product", "printAreaViewer", "assetContainer", "productViewer"],

            ctor: function () {

                this.callBase();

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
                    var assetContainer = this.$._assetContainer;

                    assetContainer.bindDomEvent(this.$downEvent, function (e) {
                        self._down(e, MOVE);
                    });

                    var scaleHandle = this.$._scaleHandle;
                    scaleHandle.bindDomEvent(this.$downEvent, function(e){
                        self._down(e, SCALE)
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
                    configuration = this.$.configuration;

                if (!configuration) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                this.$moving = true;

                this.$downPoint = {
                    x: this.$hasTouch ? e.changedTouches[0].pageX : e.pageX,
                    y: this.$hasTouch ? e.changedTouches[0].pageY : e.pageY
                };

                if (mode === MOVE) {
                    this.$startOffset = configuration.$.offset.clone();
                } else if (mode === SCALE) {

                    var factor = this.localToGlobalFactor();
                    this.$startScale = _.clone(configuration.$.scale);

                    // diagonal in real px
                    this.$scaleDiagonalDistance = this._getDistance({
                        x: 0,
                        y: 0
                    }, {
                        x: configuration.width() * factor.x,
                        y: configuration.height() * factor.y
                    });

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

            _getDistance: function(p1, p2) {
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

                if(mode === MOVE){
                    configuration.$.offset.set({
                        x: this.$startOffset.$.x - deltaX * factor.x,
                        y: this.$startOffset.$.y - deltaY * factor.y
                    });

                } else if(mode === SCALE){
                    var multiple = 1,
                        aspectRatio = configuration.width() / configuration.height();

                    if(deltaX > 0 || deltaY > 0){
                        multiple = -1;
                    }

                    if(deltaX >= deltaY){
                        y = this.$downPoint.y + deltaX / aspectRatio;
                    } else {
                        x = this.$downPoint.x + deltaY / aspectRatio;
                    }

                    var mouseDistance = this._getDistance(this.$downPoint, {
                        x: x,
                        y: y
                    });

                    mouseDistance *= multiple;

                    var scaleFactory = (this.$scaleDiagonalDistance + mouseDistance) / this.$scaleDiagonalDistance;

                    configuration.set('scale', {
                        x: scaleFactory * this.$startScale.x,
                        y: scaleFactory * this.$startScale.y
                    });

                }

                e.stopPropagation();
            },

            _up: function (e) {
                if (!this.$moving) {
                    return;
                }

                var configuration = this.$.configuration;
                if (!configuration) {
                    return;
                }

                var window = this.dom(this.$stage.$window);
                window.unbindDomEvent(this.$moveEvent, this.$moveHandler);
                window.unbindDomEvent(this.$upEvent, this.$upHandler);

                this.$moving = false;
            },

            getButtonSize: function (size) {
                var globalToLocalFactor = this.globalToLocalFactor();

                return {
                    width: globalToLocalFactor.x * size,
                    height: globalToLocalFactor.y * size
                }
            }

        });
    })
;