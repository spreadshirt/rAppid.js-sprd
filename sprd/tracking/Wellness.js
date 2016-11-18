define(["js/core/Component", "underscore", "flow", "js/lib/extension", "rAppid"], function (Component, _, flow, extension, rAppid) {

    var undefined;

    return Component.inherit('sprd.tracking.Wellness', {

        defaults: {
            /***
             * enables or disables wellness tracking
             * @type Boolean
             */
            enabled: true,

            /***
             * enables debugging to console
             * @type Boolean
             */
            debug: false,

            context: "shop",

            contextId: null,

            application: null,

            version: null,

            locale: null,

            host: null,

            platform: "EU",

            basePath: "/shopData/wellness"
        },

        ctor: function () {
            this.$trackQueue = [];
            this.$trackedEvents = [];

            var self = this,
                trackRequest = 0;

            this.$tracker = {
                track: function(action, data) {

                    trackRequest++;

                    var url = [self.$.basePath, action];

                    for (var key in data) {
                        if (data.hasOwnProperty(key) && (data[key] === null || data[key] === undefined)) {
                                data[key] = "";
                        }
                    }

                    data.locale = data.locale || self.$.locale || "";
                    data.localTime = data.localTime || Date.now().toString();
                    data.platform = (self.$.platform || "").toLowerCase();
                    data.context = self.$.context || "";
                    data.contextId = self.$.contextId || "";
                    data.application = self.$.application || "";
                    data.version = self.$.version || "";

                    url = url.join("/") + "?" + rAppid.createQueryString(data);

                    var img = new Image();
                    img.src = url;

                }
            };

            this.callBase();

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

        track: function (action, data) {

            data = data || {};

            var cacheParts = [action],
                cacheId,
                keys = _.keys(data);

            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (k !== "callback") {
                    cacheParts.push(k, data[k]);
                }
            }

            cacheId = cacheParts.join("_");

            if (cacheId) {
                if (_.indexOf(this.$trackedEvents, cacheId) !== -1) {
                    // already tracked
                    return;
                }

                this.$trackedEvents.push(cacheId);
            }

            var trackingData = _.clone(data);

            this._queueOrExecute(function () {

                if (typeof qaContext !== "undefined" && qaContext.getTrackings()) {
                    try {
                        qaContext.getTrackings().push({
                            service: "wellness",
                            type: "track",
                            action: action,
                            data: trackingData
                        });
                    } catch (e) {
                    }
                }

                // https://microsite.omniture.com/t2/help/en_US/sc/implement/index.html#Variable_Overrides
                this.track(action, trackingData);
            });

            if (this.$.debug) {
                var message = action + "-> ";
                for (var key in trackingData) {
                    if (trackingData.hasOwnProperty(key) && key !== "callback") {
                        message += key + ": " + trackingData[key] + ", ";
                    }
                }

                this._debug(message);
            }
        }

    });

});