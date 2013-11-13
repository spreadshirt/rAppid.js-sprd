define(['sprd/view/PrintTypePanelBase'], function(PrintTypePanelBase){

    return PrintTypePanelBase.inherit('sprd.view.PrintTypeSelectorClass', {

        events: ["on:printTypeSelect"],

        _onPrintTypeClick: function (e) {
            var printType = e.target.find("printType");

            this.trigger("on:printTypeSelect", printType, this);
        }
    });

});