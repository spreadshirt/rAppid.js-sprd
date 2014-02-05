define(["xaml!js/ui/Dialog"], function (Dialog) {
    return Dialog.inherit("sprd.window.MessageDialog", {
        defaults: {
            buttons: [{
                "label": "Ok",
                "classes": "dialog-btn btn-success"
            }, {
                "label": "Cancel",
                "classes": "dialog-btn"
            }],
            classes: null,
            closable: "false",
            closeOnBackdrop: "true",
            title: null,
            message: null
        },

        createDialog: function (dialogParams) {
            this.set("title", dialogParams.title);
            this.set("message", dialogParams.message);
            this.set("buttons", [this.$.buttons[dialogParams.buttons]]);
            this.set("classes", dialogParams.classes);

            this.showModal();
        }
    });
});