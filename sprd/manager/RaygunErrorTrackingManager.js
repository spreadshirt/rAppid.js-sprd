define(["sprd/manager/IErrorTrackingManager", "require"], function (IErrorTrackingManager, require) {

    return IErrorTrackingManager.inherit("sprd.manager.RaygunErrorTrackingManager", {

        defaults: {
            apiKey: null
        },

        _initializationComplete: function () {
            if (!this.$.enabled) {
                return;
            }

            if (!this.runsInBrowser()) {
                return;
            }

            var apiKey = this.$.apiKey;
            if (!apiKey) {
                this.log("Raygun apiKey not defined");
                return;
            }

            var self = this;
            setTimeout(function () {
                require(["sprd/lib/raygun"], function (Raygun) {

                    if (!Raygun) {
                        self.log("Raygun not found", "warn");
                        return;
                    }

                    Raygun.init(apiKey, {
                        allowInsecureSubmissions: true  // IE8
                    }).attach();

                    var version = self.$stage.$parameter.version;
                    if (version) {
                        Raygun.setVersion(version);
                    }

                    self._setTracker(Raygun);
                });
            }, 2000);

        }

    });

});