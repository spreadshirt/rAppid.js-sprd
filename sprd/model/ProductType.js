define(["sprd/data/SprdModel", "sprd/entity/ProductTypeView"], function (SprdModel, ProductTypeView) {
    return SprdModel.inherit("sprd.model.ProductType", {

        $schema: {
            views: [ProductTypeView]
        },

        getViewById: function(id){
            if(this.$.views){
                for (var i = 0; i < this.$.views.$items.length; i++) {
                    var view = this.$.views.$items[i];
                    if(view.id === id){
                        return view;
                    }
                }
            }
            return null;
        },
        getDefaultView: function () {
            if (this.$.defaultValues) {
                return this.getViewById(this.$.defaultValues.defaultView.id);
            }
            return null;
        },

        getPrintAreaById: function(printAreaId) {
            if(this.$.printAreas){
                for (var i = 0; i < this.$.printAreas.length; i++) {
                    var printArea = this.$.printAreas[i];
                    if (printArea.id === printAreaId) {
                        return printArea;
                    }
                }
            }
            return null;
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
                for (var i = 0; i < this.$.appearances.length; i++) {
                    app = this.$.appearances[i];
                    if (id === app.id) {
                        return app;
                    }
                }
            }
            return null;
        }
    })
});
