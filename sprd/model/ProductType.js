define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.ProductType", {
        getDefaultView: function () {
            var defaultViewId = this.$.defaultValues.defaultView;
            var view;
            for (var i = 0; i < this.$.views.$items.length; i++) {
                view = this.$.views.$items[i];
                if (defaultViewId == view.$.id) {
                    return view;
                }
            }
            return this.$.views.$items[0];
        }
    });
});
