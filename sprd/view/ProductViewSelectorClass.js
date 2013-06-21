define(["js/ui/SelectionView"], function(SelectionView) {
    return SelectionView.inherit("sprd.view.ProductViewSelectorClass", {

        hasErrorClass: function(error) {
            return error ? "error" : "";
        }

    });
});