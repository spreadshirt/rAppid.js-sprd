define(["js/ui/SelectionView", "sprd/manager/FeatureManager"], function(SelectionView, FeatureManager) {
    return SelectionView.inherit("sprd.view.ProductViewSelectorClass", {
        defaults: {
            showViewNames: false,
            product: null,
            viewHeight: 50,
            viewWidth: 50,
            viewsWithWarnings: null
        },

        inject: {
            featureManager: FeatureManager
        },

        hasErrorClass: function(error) {
            return error ? "error" : "";
        },

        hasWarning: function(view) {
            var viewsWithWarnings = this.get("viewsWithWarnings");
            return viewsWithWarnings && viewsWithWarnings.includes(view.$.id) ? "warning" : "";
        }.onChange("viewsWithWarnings", "viewsWithWarnings.size()"),

        mouse: function(e, over) {
            if (e && e.target) {
                over ? e.target.addClass("hover") : e.target.removeClass("hover");
            }
        }
    });
});