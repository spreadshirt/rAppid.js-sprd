define(['sprd/view/PrintTypePanelBase'], function(PrintTypePanelBase){

    return PrintTypePanelBase.inherit('sprd.view.PrintTypeSelectorClass', {

        events: ["on:printTypeSelect"],

        _selectPrintType: function (printType) {

            this.trigger("on:printTypeSelect", printType, this);
        }
    });

});