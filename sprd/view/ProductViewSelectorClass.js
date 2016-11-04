define(["js/ui/SelectionView", "sprd/manager/FeatureManager"], function (SelectionView, FeatureManager) {
    return SelectionView.inherit("sprd.view.ProductViewSelectorClass", {
        defaults: {
            showViewNames: false,
            product: null,
            viewHeight: 50,
            viewWidth: 50
        },

        inject: {
            featureManager: FeatureManager
        },

        hasErrorClass: function (error) {
            return error ? "error" : "";
        },

        mouse: function(e, over) {
            if (e && e.target) {
                over ? e.target.addClass("hover") : e.target.removeClass("hover");
            }
        }
    });
});