define(["js/core/Component"], function(Component) {

    return Component.inherit("sprd.manager.IErrorTrackingManager", {

        defaults: {
            enabled: true
        },

        ctor: function() {
            this.$trackQueue = [];
            this.$tracker = null;

            this.callBase();
        },

        trackError: function (error, data) {
            this._queueOrExecute(function () {
                this.trackEvent(error, data);
            });
        },

        _setTracker: function(tracker) {
            this.$tracker = tracker;
            this._trackQueue();
        },

        _trackQueue: function () {

            if (!this.$tracker) {
                return;
            }

            for (var i = 0; i < this.$trackQueue.length; i++) {
                try {
                    this.$trackQueue[i].call(this.$tracker);
                } catch (e) {
                    this.log(e, 'error');
                }
            }

            this.$trackQueue = [];
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


        /***
         * hook
         * @private
         */
        _trackError: function(error, data) {
            // track the error
        }

    });

});