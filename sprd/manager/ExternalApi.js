define(["js/core/Component", "js/core/ExternalInterface", "js/core/Bus", "sprd/manager/FeatureManager"], function (Component, ExternalInterface, Bus, FeatureManager) {

    return Component.inherit("sprd.manager.ExternalApi", {

        inject: {
            externalInterface: ExternalInterface,
            bus: Bus,
            featureManager: FeatureManager
        },

        initialize: function () {
            this.callBase();

            this._registerCallbacks(this.$.externalInterface);
        },

        _registerCallbacks: function(externalInterface) {
            // register callbacks here

            externalInterface.addCallback("getStartParameter", this.getStartParameter, this);
            externalInterface.addCallback("setFeatureState", this.setFeatureState, this);
            externalInterface.addCallback("getFeatureState", this.getFeatureState, this);

        },

        triggerAsync: function (eventType, event) {

            var bus = this.$.bus;

            setTimeout(function () {
                bus.trigger(eventType, event);
            }, 1);
        },

        getStartParameter: function() {
            return this.$stage.$parameter;
        },

        setFeatureState: function (featureName, state) {
            return this.$.featureManager.setFeatureState(featureName, state);
        },

        getFeatureState: function (featureName) {
            return this.$.featureManager.getFeatureState(featureName);
        }

    });
});
