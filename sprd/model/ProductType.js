define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.ProductType", {
        getDefaultView: function () {
            if (this.$.defaultValues) {
                var defaultViewId = this.$.defaultValues.defaultView.id;
                var view;
                for (var i = 0; i < this.$.views.$items.length; i++) {
                    view = this.$.views.$items[i];
                    if (defaultViewId === view.id) {
                        return view;
                    }
                }
            }
            return this.$.views.$items[0];
        },
        getDefaultAppearance: function () {
            if (this.$.defaultValues) {
                return this.getAppearanceById(this.$.defaultValues.defaultAppearance.id);
            }
            return null;
        },
        getAppearanceById: function(id){
            if(this.$.appearances){
                var app;
                for (var i = 0; i < this.$.appearances.$items.length; i++) {
                    app = this.$.appearances.$items[i];
                    if (id === app.id) {
                        return app;
                    }
                }
            }
            return null;
        }
    })
});
