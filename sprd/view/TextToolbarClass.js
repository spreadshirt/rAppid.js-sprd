define(["designer/view/TextPanelBase", "js/core/I18n"], function(TextPanelBase, I18n){

    var TEXT_ANCHOR_TO_LABEL_MAP = {
        "start": "L",
        "end": "R",
        "middle": "C"
    };

    return TextPanelBase.inherit('productomat.view.TextToolbarClass', {

        inject: {
            i18n: I18n
        },

        textAnchorLabel: function () {
            return TEXT_ANCHOR_TO_LABEL_MAP[this.$.textAnchor];
        }.onChange("textAnchor"),

        indexToPos: function(index){
            return -(index * 34 - 10);
        }

    });

});