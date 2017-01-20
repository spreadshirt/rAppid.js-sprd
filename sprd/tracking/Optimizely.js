define(["js/core/Component", "underscore", "flow"], function (Component, _, flow) {

    return Component.inherit('sprd.tracking.Optimizely', {

        defaults: {
            /***
             * indicated if optimizely tracking is enabled
             * @type Boolean
             */
            enabled: true,

            /***
             * enables debugging to console
             * @type Boolean
             */
            debug: false,

            /***
             * the number of tries to find the 'optimizely' object on the window object
             */
            maxTries: 10
        },

        events: [
        /***
         * the trackingInitialized event is dispatched after the 'optimizely' object has been found on
         * the window object
         */
            "on:trackingInitialized"
        ],

        ctor: function () {
            this.$trackQueue = [];
            this.$trackedEvents = [];
            this.$tracker = null;

            this.callBase();
        },

        _initializationComplete: function () {

            var tries = 0,
                window = this.$stage.$window,
                self = this;

            this.callBase();

            if (this.runsInBrowser()) {
                initializeTracking();
            }

            function initializeTracking() {
                tries++;

                var optimizely = window["optimizely"];

                if (optimizely && _.isObject(optimizely) && !_.isArray(optimizely) && "trackEvent" in optimizely) {
                    self.$tracker = optimizely;
                    self.trigger("on:trackingInitialized");
                    self._trackQueue();
                } else {
                    if (self.$.maxTries <= 0 || tries < self.$.maxTries) {
                        setTimeout(initializeTracking, 200);
                    }
                }
            }
        },

        _queueOrExecute: function (executeFunction) {

            // do not track during node rendering or when disabled
            if (!this.runsInBrowser() || !this.$.enabled) {
                return;
            }

            if (this.$tracker) {
                // tracker available
                try {
                    executeFunction.apply(this.$tracker);
                } catch (e) {
                    this.log(e, 'error');
                }
            } else {
                // queue it
                this.$trackQueue.push(executeFunction);
            }

        },

        _trackQueue: function () {
            var self = this;
            // track all events from queue
            flow()
                .seqEach(this.$trackQueue, function (executeFunction) {
                    executeFunction.apply(self.$pageTracker);
                })
                .exec(function () {
                    self.$trackQueue = [];
                });
        },

        /***
         * Activate manual activation mode experiments. When you call "activate" the given experiment is run if the visitor meets the experiment's targeting conditions.
         *
         * @param experimentId
         * @see https://www.optimizely.com/docs/api#activate
         */
        activate: function(experimentId) {
            this._queueOrExecute(function () {
                this.activate(experimentId);
            });
        },

        /***
         * Integrate with SiteCatalyst. You must call "activateSiteCatalyst" after the "s_code.js" file has loaded.
         *
         * @param {String} [sVariable]
         * @see https://www.optimizely.com/docs/api#site-catalyst
         */
        activateSiteCatalyst: function(sVariable) {

            var data;

            if (sVariable) {
                data = {
                    sVariable: sVariable
                }
            }

            this._queueOrExecute(function () {
                this.activateSiteCatalyst(data);
            });
        },

        /***
         * Delay pageview tracking by a specified number of milliseconds.
         *
         * @param delay - the delay in milliseconds
         * @see https://www.optimizely.com/docs/api#delay-pageview
         */
        delayPageviewTracking: function(delay) {
            this._queueOrExecute(function () {
                this.delayPageviewTracking(delay);
            });
        },

        /***
         * Opt a visitor out of Optimizely tracking. For example, you may want to opt visitors out of Optimizely tracking as part of your site's broader opt-out preferences.
         *
         * @see https://www.optimizely.com/docs/api#opt-out
         */
        optOut: function() {
            this._queueOrExecute(function () {
                this.optOut();
            });
        },

        _debug: function (message) {
            if (this.$.debug) {
                this.log(message);
            }
        },

        /***
         * Track custom events in Optimizely. The event "eventName" will be tracked and associated with the current visitor.
         *
         * @param {String} eventName
         * @param {Object} [data]
         * @see https://www.optimizely.com/docs/api#track-event
         */
        trackEvent: function (eventName, data) {
            this._queueOrExecute(function () {

                this.trackEvent(eventName, data);
            });

            this._debug('trackEvent: ' + [eventName, JSON.stringify(data || {})].join(', '));

            if (typeof qaContext !== "undefined" && qaContext.getTrackings()) {
                try {
                    qaContext.getTrackings().push({
                        service: "optimizely",
                        type: "event",
                        data: {
                            eventName: eventName,
                            data: data
                        }
                    });
                } catch (e) {
                }
            }

        },

        setDimensionValue: function(dimensionId, value) {
            this._queueOrExecute(function() {
                this.setDimensionValue(dimensionId, value);
            });
        }

    });

});