define(["js/core/Component", "underscore", "flow"], function (Component, _, flow) {

    return Component.inherit('sprd.tracking.Omniture', {

        defaults: {
            /***
             * enables or disables adobe omniture tracking
             * @type Boolean
             */
            enabled: true,

            /***
             * enables debugging to console
             * @type Boolean
             */
            debug: false,

            /***
             * the number of tries to find the s object on the window
             * @type Number
             */
            maxTries: 10
        },

        events: [
        /***
         * the trackingInitialized event is dispatched after the s object has been found on
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

                if (window.s && _.isObject(window.s)) {
                    self.$tracker = window.s;
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

        track: function (oneTimeIdentifier, data, events) {
            data = data || {};

            if (oneTimeIdentifier) {
                if (_.indexOf(this.$trackedEvents, oneTimeIdentifier) !== -1) {
                    // already tracked
                    return;
                }

                this.$trackedEvents.push(oneTimeIdentifier);
            }

            var trackingData = _.clone(data);
            if (events) {
                // https://microsite.omniture.com/t2/help/en_US/sc/implement/index.html#Methods_of_Event_Serialization
                trackingData.events = (events || []).join(",");
            }

            this._queueOrExecute(function () {


                if (typeof qaContext !== "undefined" && qaContext.getTrackings()) {
                    try {
                        qaContext.getTrackings().push({
                            service: "omniture",
                            type: "track",
                            data: trackingData
                        });
                    } catch (e) {
                    }
                }

                // https://microsite.omniture.com/t2/help/en_US/sc/implement/index.html#Variable_Overrides
                this.t(trackingData);
            });

            if (this.$.debug) {
                var message = "";
                for (var key in trackingData) {
                    if (trackingData.hasOwnProperty(key)) {
                        message += key + ": " + trackingData[key] + ", ";
                    }
                }

                this._debug(message);
            }


        }

    });

});