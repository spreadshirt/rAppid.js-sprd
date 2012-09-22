define(["sprd/data/SprdModel", "sprd/entity/ProductTypeView", "js/data/Entity"], function (SprdModel, ProductTypeView, Entity) {
    return SprdModel.inherit("sprd.model.ProductType", {

        $schema: {
            views: [ProductTypeView],
            appearances: [Entity],
            sizes: [Entity]
        },

        parse: function(dataSource, data) {
            data = this.callBase(dataSource, data);

            var self = this;
            if (data.views) {
                data.views.each(function (value) {
                    value.set('productType', self);
                });
            }

            return data;
        },

        getViewById: function(id){
            if(this.$.views){
                for (var i = 0; i < this.$.views.$items.length; i++) {
                    var view = this.$.views.$items[i];
                    if(view.$.id === id){
                        return view;
                    }
                }
            }
            return null;
        },
        getSizeById: function(id){
            if(this.$.sizes){
                return this.$.sizes.each(function(size){
                    if(size.$.id === id){
                        this.return(size);
                    }
                });
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
                for (var i = 0; i < this.$.appearances.$items.length; i++) {
                    app = this.$.appearances.$items[i];
                    if (id === app.$.id) {
                        return app;
                    }
                }
            }
            return null;
        },
        getViewByPerspective: function(perspective){
            if (this.$.views) {
                for (var i = 0; i < this.$.views.$items.length; i++) {
                    var view = this.$.views.$items[i];
                    if (view.$.perspective === perspective) {
                        return view;
                    }
                }
            }
            return null;
        }
    })
});
