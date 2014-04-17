define(["sprd/manager/IErrorTrackingManager", "sprd/lib/raygun"], function(IErrorTrackingManager, Raygun) {

    return IErrorTrackingManager.inherit("sprd.manager.RaygunErrorTrackingManager", {

        defaults: {
            apiKey: null
        },

        _initializationComplete: function () {
            if (!this.$.enabled) {
                return;
            }

            if (!Raygun) {
                this.log("Raygun not found", "warn");
                return;
            }

            var apiKey = this.$.apiKey;
            if (!apiKey) {
                this.log("Raygun apiKey not defined");
                return;
            }

            Raygun.init(apiKey).attach();

            var version = this.$stage.$parameter.version;
            if (version) {
                Raygun.setVersion(version);
            }
        }

    });

});