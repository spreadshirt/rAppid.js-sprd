define(["js/core/Component", "js/core/ExternalInterface", "js/core/Bus"], function (Component, ExternalInterface, Bus) {

    return Component.inherit("sprd.manager.ExternalApi", {

        inject: {
            externalInterface: ExternalInterface,
            bus: Bus
        },

        initialize: function () {
            this.callBase();

            this._registerCallbacks(this.$.externalInterface);
        },

        _registerCallbacks: function(externalInterface) {
            // register callbacks here
        },

        triggerAsync: function (eventType, event) {

            var bus = this.$.bus;

            setTimeout(function () {
                bus.trigger(eventType, event);
            }, 1);
        },

        getStartParameter: function() {
            return this.$stage.$parameter;
        }

    });
});
