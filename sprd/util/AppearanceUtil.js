define(["underscore", "js/core/List", "js/type/Color"], function (_, List, Color) {

    var colorArray = [
        "universal.COLOR_WHITE", 0xFFFFFF,
        "universal.COLOR_BLACK", 0x000000,
        "universal.COLOR_BLUE", 0x2244AA,
        "universal.COLOR_RED", 0xB91816,
        "universal.COLOR_GREY", 0xCCCCCC,
        "universal.COLOR_BROWN", 0x664B2F,
        "universal.COLOR_GREEN", 0x669933,
        "universal.COLOR_YELLOW", 0xFFF500,
        "universal.COLOR_TURQUOISE", 0x0AC7DF,
        "universal.COLOR_PINK", 0xFB4E81
    ];


    var productTypeToColorMap = {},
        colorMap = {},
        colors = [];

    return {
        /***
         * initializes the productTypeColorCache
         * @param {js.core.List} productTypes
         */
        initProductTypeColorCache: function (productTypes) {
            var color,
                distance,
                bestColor,
                bestAppearance,
                tmpDistance,
                tmpProductType,
                colorKey;
            colors = [];
            for(var i = 1; i <= colorArray.length; i = i+2){
                color = Color.parse(colorArray[i]);
                colors.push(color);
                colorMap[color.toString()] = color;
            }


            productTypes.each(function (productType) {
                bestColor = null;
                productTypeToColorMap[productType.$.id] = tmpProductType = {};
                productType.$.appearances.each(function (appearance) {
                    distance = Number.MAX_VALUE;
                    bestColor = null;
                    for (var i = 0; i < colors.length; i++) {
                        color = colors[i];
                        bestAppearance = null;
                        tmpDistance = color.distanceTo(appearance.getMainColor());
                        if (tmpDistance < distance) {
                            distance = tmpDistance;
                            bestColor = color;
                        }
                    }
                    colorKey = bestColor.toString();
                    if(!tmpProductType[colorKey]){
                        tmpProductType[colorKey] = [];
                    }
                    tmpProductType[colorKey].push(appearance);
                });
            });
        },
        /***
         * Returns true of the productType has the given color
         * @param {sprd.model.ProductType} productType
         * @param {js.type.Color} color
         * @returns {*|boolean}
         */
        hasProductTypeColor: function(productType, color){
            return color && productTypeToColorMap[productType.$.id] && productTypeToColorMap[productType.$.id].hasOwnProperty(color.toString());
        },
        /***
         *
         * @param {sprd.model.ProductType} productType
         * @param {js.type.Color} color
         * @returns {*}
         */
        getAppearanceForProductTypeAndColor: function(productType, color){
            if(color && productType){
                var colorHash = productTypeToColorMap[productType.$.id],
                    appearances = colorHash[color.toString()];

                if(appearances && appearances.length){
                    return appearances[0];
                }
            }
            return null;
        },
        /***
         * Returns a Array of color strings for a js.core.List of productTypes
         * @param {js.core.List} productTypes
         * @returns {Array}
         */
        getColorsForProductTypes: function(productTypes){

            var colorHash,
                ret = [];
            productTypes.each(function(productType){
                colorHash = productTypeToColorMap[productType.$.id];
                for(var color in colorHash){
                    if(colorHash.hasOwnProperty(color)){
                        if(ret.indexOf(colorMap[color]) === -1){
                            ret.push(colorMap[color]);
                        }
                    }
                }
            });

            return ret;
        }

    };

});