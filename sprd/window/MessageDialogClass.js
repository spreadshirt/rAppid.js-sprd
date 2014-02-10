define(["xaml!js/ui/Dialog"], function (Dialog) {
    return Dialog.inherit("sprd.window.MessageDialogClass", {
        defaults: {
            buttons: null,
            closable: false,
            closeOnBackdrop: true,
            title: null,
            message: null
        },

        _closeDialog: function (button) {
            this.close(button);
        }
    });
});