define(["js/core/Component"], function (Component) {
    return Component.inherit("sprd.manager.TrackingManagerBase", {
        ctor: function () {
            this.$uniqueId = (new Date()).getTime();
            this.callBase();
        }
    });
});