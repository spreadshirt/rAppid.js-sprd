define(["js/ui/SelectionView", "sprd/manager/FeatureManager"], function (SelectionView, FeatureManager) {
    return SelectionView.inherit("sprd.view.ProductViewSelectorClass", {
        defaults: {
            showViewNames: false
        },

        inject: {
            featureManager: FeatureManager
        },

        hasErrorClass: function (error) {
            return error ? "error" : "";
        }
    });
});