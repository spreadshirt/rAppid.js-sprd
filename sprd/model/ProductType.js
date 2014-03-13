define(["sprd/data/SprdModel", "sprd/entity/ProductTypeView", "js/data/Entity", "sprd/entity/Appearance", "sprd/collection/StockStates", 'js/core/List', 'sprd/entity/ProductTypeSize', 'sprd/entity/PrintArea', 'js/type/Color', 'sprd/entity/Price'], function (SprdModel, ProductTypeView, Entity, Appearance, StockStates, List, Size, PrintArea, Color, Price) {
    return SprdModel.inherit("sprd.model.ProductType", {

        schema: {
            views: [ProductTypeView],
            appearances: [Appearance],
            printAreas: [PrintArea],
            sizes: [Size],
            price: Price,
            stockStates: StockStates,

            sizeFitHint: String
        },

        defaults: {
            availableAppearances: List,
            outOfStock: false,

            sizeFitHint: "normal"
        },

        getViewById: function (id) {

            if (!id) {
                return null;
            }

            if (this.$.views) {
                for (var i = 0; i < this.$.views.$items.length; i++) {
                    var view = this.$.views.$items[i];
                    if (view.$.id == id) {
                        return view;
                    }
                }
            }
            return null;
        },

        containsView: function (view) {

            if (this.$.views) {
                return this.$.views.includes(view);
            }

            return false;
        },

        containsAppearance: function (appearance) {

            if (this.$.appearances) {
                return this.$.appearances.includes(appearance);
            }
            return false;
        },

        containsSize: function (size) {

            if (this.$.sizes) {
                return this.$.sizes.includes(size);
            }

            return false;
        },

        getSizeById: function (id) {
            if (this.$.sizes) {
                return this.$.sizes.find(function (size) {
                    return size.$.id == id;
                });
            }
            return null;
        },

        getSizeByName: function (name) {
            if (this.$.sizes) {
                return this.$.sizes.find(function (size) {
                    return size.$.name == name;
                });
            }
            return null;
        },

        getDefaultView: function () {
            if (this.$.defaultValues) {
                return this.getViewById(this.getDefaultViewId());
            }
            return null;
        },

        getDefaultViewId: function () {
            if (this.$.defaultValues) {
                return this.$.defaultValues.defaultView.id;
            }
            return null;
        },

        getPrintAreaById: function (printAreaId) {
            if (this.$.printAreas) {
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
            return this.getAppearanceById(this.getDefaultAppearanceId());

        },

        getDefaultAppearanceId: function () {
            if (this.$.defaultValues) {
                return this.$.defaultValues.defaultAppearance.id;
            }
            return null;
        },

        getAppearanceById: function (id) {
            if (this.$.appearances) {
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
        getClosestAppearance: function (color) {
            color = Color.parse(color);

            var ret = null,
                minDistance = null,
                appearances = this.$.appearances;

            if (appearances) {
                appearances.each(function (appearance) {
                    var distance = color.distanceTo(appearance.getMainColor());
                    if (minDistance === null || distance < minDistance) {
                        minDistance = distance;
                        ret = appearance;
                    }
                });
            }

            return ret;

        },

        getViewByPerspective: function (perspective) {
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

        getDefaultPrintArea: function () {
            if (this.$.printAreas) {
                return this.$.printAreas.at(0);
            }

            return null;
        },

        getAvailableSizesForAppearance: function (appearance) {
            if (!appearance) {
                return null;
            }
            var sizes = new List();
            if (this.$.sizes && this.$.stockStates) {
                var size;
                for (var i = 0; i < this.$.sizes.length; i++) {
                    size = this.$.sizes.at(i);
                    if (this.$.stockStates.isSizeAndAppearanceAvailable(size, appearance)) {
                        sizes.add(size);
                    }
                }
            } else {
                return this.$.sizes;
            }
            return sizes;
        }.on(['stockStates', 'reset']),

        isSizeAndAppearanceAvailable: function (size, appearance) {
            if (this.$.stockStates) {
                return this.$.stockStates.isSizeAndAppearanceAvailable(size, appearance);
            }
            return false;
        }.on(['stockStates', 'reset']),


        getMeasures: function () {
            if (this.$.sizes && this.$.sizes.size() > 0) {
                return this.$.sizes.at(0).$.measures;
            }
            return [];
        }.onChange('sizes'),

        getFirstAvailableAppearance: function () {
            var appearances = this.getAvailableAppearances();
            if(appearances){
                return appearances.at(0);
            }
            return null;
        }.onChange("stockStates"),

        isOutOfStock: function () {
            var availableAppearances = this.getAvailableAppearances();
            return availableAppearances && availableAppearances.size() > 0;
        },

        getAvailableAppearances: function () {
            if (this._cachedAvailableAppearances) {
                return this._cachedAvailableAppearances;
            }
            if (this.$.stockStates) {
                this._cachedAvailableAppearances = new List();
                var self = this;
                this.$.appearances.each(function (appearance) {
                    if (self.getAvailableSizesForAppearance(appearance).size() > 0) {
                        self._cachedAvailableAppearances.add(appearance);
                    }
                });
                return this._cachedAvailableAppearances;
            }

            return null;
        }.onChange("stockStates"),

        _commitStockStates: function (stockStates) {
            if (stockStates) {
                this._cachedAvailableAppearances = null;
            }
        }
    })
});
