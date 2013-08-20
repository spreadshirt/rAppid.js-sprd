define(["js/core/Component", "underscore", "flow", "js/lib/extension"], function (Component, _, flow, extension) {

    var undefined;

    return Component.inherit('sprd.tracking.Omniture', {

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

            basePath: "/sprd-frontend/wellness/track"
        },

        ctor: function () {
            this.$trackQueue = [];
            this.$trackedEvents = [];

            var self = this,
                trackRequest = 0,
                callbackName;

            this.$tracker = {
                track: function(action, data) {

                    var url = [self.$.basePath,
                        (self.$.platform || "EU").toLowerCase(),
                        self.$.context === "shop" ? self.$.contextId : -1,  // TODO: send context, needs a fix from jbe in wellness
                        self.$.application,
                        self.$.version || -1,
                        action];

                    if (callbackName && !data.hasOwnProperty("callback")) {
                        data.callback = callbackName;
                    }

                    for (var key in data) {
                        if (data.hasOwnProperty(key)) {
                            if (data[key] === null || data[key] === undefined) {
                                data[key] = "";
                            }
                        }
                    }

                    data.locale = data.locale || self.$.locale || "";
                    data.localTime = data.localTime || Date.now().toString();

                    url = url.join("/") + "?" + rAppid.createQueryString(data);

                    if (self.$.host) {
                        url = "//www" + (++trackRequest % 10) + "." + self.$.host + url;
                    }

                    var head = document.getElementsByTagName('head')[0];

                    var script = document.createElement("script");
                    script.type = "text/javascript";
                    script.src = url;
                    script.async = true;

                    head && head.appendChild(script);

                }
            };

            this.callBase();

            if (this.runsInBrowser()) {
                callbackName = "wellnessTracking" + this.$cid;
                window[callbackName] = window[callbackName] || function() {
                    // empty jsonp callback
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