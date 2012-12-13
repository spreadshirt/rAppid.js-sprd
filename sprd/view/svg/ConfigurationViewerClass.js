define(['js/svg/SvgElement', 'sprd/entity/TextConfiguration', 'sprd/entity/DesignConfiguration', "sprd/view/svg/TextConfigurationRenderer", "sprd/view/svg/DesignConfigurationRenderer"],
    function (SvgElement, TextConfiguration, DesignConfiguration, TextConfigurationRenderer, DesignConfigurationRenderer) {

        return SvgElement.inherit({

            defaults: {
                tagName: 'g',
                componentClass: 'configuration-viewer',
                configuration: null,

                translateX: "{configuration.offset.x}",
                translateY: "{configuration.offset.y}",

                _assetContainer: null,
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
                        self._down(e);
                    });

                }

            },

            unbindDomEvent: function (type, cb) {
                this.callBase();
            },

            _down: function (e) {

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

                this.$startOffset = configuration.$.offset.clone();

                this.$downX = this.$hasTouch ? e.changedTouches[0].pageX : e.pageX;
                this.$downY = this.$hasTouch ? e.changedTouches[0].pageY : e.pageY;

                var window = this.dom(this.$stage.$window);

                this.$moveHandler = function (e) {
                    self._move(e);
                };

                this.$upHandler = function (e) {
                    self._up(e);
                };

                window.bindDomEvent(this.$moveEvent, this.$moveHandler);
                window.bindDomEvent(this.$upEvent, this.$upHandler);
            },

            _move: function (e) {
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
                    factor = this.localToGlobalFactor();

                configuration.$.offset.set({
                    x: this.$startOffset.$.x - (this.$downX - x) * factor.x,
                    y: this.$startOffset.$.y - (this.$downY - y) * factor.y
                });

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
                var localToGlobalFactor = this.localToGlobalFactor();

                return {
                    width: localToGlobalFactor.x * size,
                    height: localToGlobalFactor.y * size
                }
            }

        });
    })
;