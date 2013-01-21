define(["sprd/data/SprdModel", "sprd/entity/ProductTypeView", "js/data/Entity", "sprd/entity/Appearance","sprd/collection/StockStates", 'js/core/List', 'sprd/entity/ProductTypeSize', 'sprd/entity/PrintArea', 'sprd/type/Color', 'sprd/entity/Price'], function (SprdModel, ProductTypeView, Entity, Appearance, StockStates, List, Size, PrintArea, Color, Price) {
    return SprdModel.inherit("sprd.model.ProductType", {

        schema: {
            views: [ProductTypeView],
            appearances: [Appearance],
            printAreas: [PrintArea],
            sizes: [Size],
            price: Price,
            stockStates: StockStates
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

        containsView: function(view) {

            if (this.$.views) {
                return this.$.views.includes(view);
            }

            return false;
        },

        containsAppearance: function(appearance) {

            if (this.$.appearances) {
                return this.$.appearances.includes(appearance);
            }
            return false;
        },

        getSizeById: function(id){
            if(this.$.sizes){
                return this.$.sizes.each(function(size){
                    if(size.$.id === id){
                        this['return'](size);
                    }
                });
            }
            return null;
        },

        getSizeByName: function (name) {
            if (this.$.sizes) {
                return this.$.sizes.each(function (size) {
                    if (size.$.name == name) {
                        this['return'](size);
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
                for (var i = 0; i < this.$.printAreas.$items.length; i++) {
                    var printArea = this.$.printAreas.$items[i];
                    if (printArea.$.id == printAreaId) {
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
                    if (id == app.$.id) {
                        return app;
                    }
                }
            }
            return null;
        },
        /***
         * Returns closest appearance for Color
         * @param {String|Color} color
         * @return {*}
         */
        getClosestAppearance: function(color) {
            color = Color.parse(color);

            var ret = null,
                minDistance = null,
                appearances = this.$.appearances;

            if (appearances) {
                appearances.each(function(appearance) {
                    var distance = color.distanceTo(appearance.getMainColor());
                    if (minDistance === null || distance < minDistance) {
                        minDistance = distance;
                        ret = appearance;
                    }
                });
            }

            return ret;

        },

        getViewByPerspective: function(perspective){
            if (this.$.views) {
                for (var i = 0; i < this.$.views.$items.length; i++) {
                    var view = this.$.views.$items[i];
                    if (view.$.perspective == perspective) {
                        return view;
                    }
                }
            }
            return null;
        },

        getDefaultPrintArea: function() {
            if (this.$.printAreas) {
                return this.$.printAreas.at(0);
            }

            return null;
        },

        getAvailableSizesForAppearance: function(appearance){
            if(!appearance){
                return null;
            }
            var sizes = new List();
            if (this.$.sizes && this.$.stockStates) {
                var size;
                for(var i = 0; i < this.$.sizes.length; i++){
                    size = this.$.sizes.at(i);
                    if(this.$.stockStates.isSizeAndAppearanceAvailable(size, appearance)){
                        sizes.add(size);
                    }
                }
            }else{
                return this.$.sizes;
            }
            return sizes;
        }.on(['stockStates','add']),

        isSizeAndAppearanceAvailable: function(size, appearance){
            if(this.$.stockStates){
                return this.$.stockStates.isSizeAndAppearanceAvailable(size, appearance);
            }
            return false;
        }.on(['stockStates', 'add']),


        getMeasures: function(){
            if(this.$.sizes && this.$.sizes.size() > 0){
                return this.$.sizes.at(0).$.measures;
            }
            return [];
        }.onChange('sizes')
    })
});
