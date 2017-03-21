define(["sprd/model/ProductTypeBase", "sprd/entity/ProductTypeView", "sprd/entity/Appearance", "sprd/collection/StockStates", 'sprd/entity/ProductTypeSize', 'sprd/entity/ProductTypeAttribute', 'sprd/entity/PrintArea', 'js/type/Color', 'sprd/entity/Price'],
    function(ProductTypeBase, ProductTypeView, Appearance, StockStates, Size, Attribute, PrintArea, Color, Price) {
        return ProductTypeBase.inherit("sprd.model.ProductType", {

            schema: {
                views: [ProductTypeView],
                appearances: [Appearance],
                printAreas: [PrintArea],
                sizes: [Size],
                attributes: [Attribute],
                price: Price,
                stockStates: StockStates,

                sizeFitHint: String
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

            getViewByView: function(view) {
                return view && this.getViewByPerspective(view.$.perspective);
            },

            getViewByPrintArea: function(printArea) {
                return this.getViewByView(printArea.getDefaultView());
            },

            getViewByConfiguration: function(configuration) {
                return this.getViewByPrintArea(configuration.$.printArea);
            }
        })
    });
