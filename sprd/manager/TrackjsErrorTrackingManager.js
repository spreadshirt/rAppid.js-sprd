define(["sprd/manager/IErrorTrackingManager", "require", "flow", "underscore"], function (IErrorTrackingManager, require, flow, _) {

    return IErrorTrackingManager.inherit("sprd.manager.TrackjsErrorTrackingManager", {

        defaults: {
            apiKey: null,

            application: null,

            ignoreMessages: null
        },

        _initializationComplete: function () {
            if (!this.$.enabled) {
                return;
            }

            if (!this.runsInBrowser()) {
                return;
            }

            if (typeof trackJs !== "undefined") {
                // trackjs already initialied
                this._setTracker(trackJs);
            } else {
                var apiKey = this.$.apiKey;
                if (!apiKey) {
                    this.log("Trackjs apiKey not defined");
                    return;
                }

                var self = this,
                    configure = !window._trackJs;

                if (configure) {
                    window._trackJs = {
                        token: self.$.apiKey,
                        application: self.$.application,
                        version: self.$stage.$parameter.version,
                        onError: function (payload, error) {

                            var messages = self.$.ignoreMessages || [];

                            if (_.isString(messages)) {
                                messages = messages.split(",")
                            }

                            for (var i = 0; i < messages.length; i++) {
                                if ((payload.message || "").indexOf(messages[i]) != -1) {
                                    return false;
                                }
                            }

                            return true;
                        }
                    };
                }

                require(["//d2zah9y47r7bi2.cloudfront.net/releases/current/tracker.js"], function () {

                    var trackJs = window.trackJs;

                    if (!trackJs) {
                        self.log("Trackjs not found", "warn");
                        return;
                    }

                    self._setTracker(trackJs);
                });
            }

        },

        _setTracker: function (trackJs) {

            var self = this;

            if (trackJs && typeof Flow != "undefined") {
                Flow.prototype.errorHandler = function (e) {
                    self.trackError(e);
                };
            }

            this.callBase();
        },

        trackError: function (error) {
            this._queueOrExecute(function () {
                this.track(error);
            });
        }

    });

});