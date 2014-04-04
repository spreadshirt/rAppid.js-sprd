define(["js/core/Component"], function (Component) {
    return Component.inherit("sprd.manager.TrackingManager", {
        ctor: function () {
            this.$uniqueId = (new Date()).getTime();
            this.callBase();
        },

        trackUploadDesignCreationFailed: function(err) {
            var google = this.$.google;
            google && google.trackEvent("Upload", "DesignCreationFailed", this.get(err, "xhr.responses.text"));
        },

        trackUploadFailed: function(err) {
            var google = this.$.google;
            google && google.trackEvent("Upload", "Failed", (err || "").toString());
        },

        trackUploadSuccess: function() {
            var google = this.$.google;
            google && google.trackEvent("Upload", "Success");
        }
    });
});