define(["js/ui/View", "sprd/lib/ScrollIntoViewIfNeeded"], function(View, ScrollIntoViewIfNeeded) {
    return View.inherit({

        _renderSelected: function(selected) {

            this.callBase();

            if (selected) {
                ScrollIntoViewIfNeeded(this.$el);
            }
        }

    });
});