define(["js/core/Component", "underscore", "flow"], function (Component, _, flow) {

    return Component.inherit('sprd.tracking.DTM', {

        defaults: {
            /***
             * indicated if _satellite tracking is enabled
             * @type Boolean
             */
            enabled: true,

            /***
             * enables debugging to console
             * @type Boolean
             */
            debug: false,

            /***
             * the number of tries to find the '_satellite' object on the window object
             */
            maxTries: 10
        },

        events: [
        /***
         * the trackingInitialized event is dispatched after the '_satellite' object has been found on
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

                var _satellite = window["_satellite"];

                if (_satellite && _.isObject(_satellite) && !_.isArray(_satellite) && "track" in _satellite) {
                    self.$tracker = _satellite;
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


        _debug: function (message) {
            if (this.$.debug) {
                this.log(message);
            }
        },


        track: function (eventName, data) {
            this._queueOrExecute(function () {
                window.dtm = window.dtm || {};
                window.dtm[eventName] = data;
                this.track(eventName);
            });

            this._debug('track: ' + [eventName, JSON.stringify(data || {})].join(', '));

            if (typeof qaContext !== "undefined" && qaContext.getTrackings()) {
                try {
                    qaContext.getTrackings().push({
                        service: "satellite",
                        type: "event",
                        data: {
                            eventName: eventName,
                            data: data
                        }
                    });
                } catch (e) {
                }
            }

        }

    });

});