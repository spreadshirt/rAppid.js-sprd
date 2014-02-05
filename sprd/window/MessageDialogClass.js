define(["xaml!js/ui/Dialog"], function (Dialog) {
    return Dialog.inherit("sprd.window.MessageDialog", {
        defaults: {
            buttons: null,
            closable: false,
            closeOnBackdrop: true,
            title: null,
            message: null
        }
    });
});