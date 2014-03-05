define(["xaml!js/ui/Dialog", "js/core/History", "js/core/I18n"], function (Dialog, History, I18n) {

    var urlMap = {};

    return Dialog.inherit("sprd.window.IFrameWindowClass", {

        defaults: {
            src: null,
            closable: true,
            closeOnBackdrop: true,
            "class": "iframe-window",
            loaded: false
        },

        inject: {
            history: History,
            i18n: I18n
        },

        start: function (callback) {
            callback && callback();
        },

        url: function (what) {
            // HOOK: Will be overwritten.
        },

        navigateTo: function () {
            // HOOK: Will be overwritten.
        },

        loaded: function () {
            this.set("loaded", true);
        },

        _onbackdropClick: function() {
            if (this.$.closeOnBackdrop) {
                this.close(true);
            }
        },

        closeDialog: function() {
            this.close(true);
        },

        close: function (userAction) {
            this.callBase();

            if (userAction) {
                this.navigateTo();
            }
        }
    });
});