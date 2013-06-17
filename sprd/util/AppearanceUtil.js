define(["underscore", "js/core/List", "js/type/Color"], function (_, List, Color) {

    var COLOR_MAP = {
        white: 0xFFFFFF,
        black: 0x000000,
        blue: 0x2244AA,
        red: 0xB91816,
        grey: 0xCCCCCC,
        brown: 0x664B2F,
        green: 0x669933,
        yellow: 0xFFF500,
        turquoise: 0x0AC7DF,
        pink: 0xFB4E81
    };

    var productTypeToColorMap = {},
        colorMap = {},
        colors = [],
        productTypeDepartmentToSizeMap = {},
        categoryToSizeMap = {},
        departmentProductTypeMap = {},
        productTypeToDepartmentsMap = {};

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

            for (var key in COLOR_MAP) {

                if (COLOR_MAP.hasOwnProperty(key)) {
                    color = Color.parse(COLOR_MAP[key]);
                    color.key = key;
                    colors.push(color);
                    colorMap[color.toString()] = color;
                }
            }

            productTypes.each(function (productType) {
                bestColor = null;
                productTypeToColorMap[productType.$.id] = tmpProductType = {};
                if (productType.$.appearances) {
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
                        if (!tmpProductType[colorKey]) {
                            tmpProductType[colorKey] = [];
                        }
                        tmpProductType[colorKey].push(appearance);
                    });
                }
            });
        },
        /***
         *
         * @param {js.core.List} productTypeDepartments
         */
        initProductTypeSizeCache: function (productTypeDepartments) {

            var departmentSizes,
                categorySizes;

            productTypeDepartments.each(function (productTypeDepartment, index) {
                departmentSizes = productTypeDepartmentToSizeMap[productTypeDepartment.$.name] = {
                    order: index
                };
                productTypeDepartment.$.categories.each(function (category) {
                    categorySizes = categoryToSizeMap[category.identifier()] = {};
                    category.$.productTypes.each(function (productType) {
                        if (productType.$.sizes) {
                            productType.$.sizes.each(function (size) {
                                if (!departmentSizes[size.$.name]) {
                                    departmentSizes[size.$.name] = {
                                        productTypes: []
                                    };
                                }
                                departmentSizes[size.$.name].productTypes.push(productType);
                                if (!categorySizes[size.$.name]) {
                                    categorySizes[size.$.name] = {
                                        productTypes: []
                                    };
                                }
                                categorySizes[size.$.name].productTypes.push(productType);
                            });

                            departmentProductTypeMap[productTypeDepartment.$.name] = departmentProductTypeMap[productTypeDepartment.$.name] || {};
                            departmentProductTypeMap[productTypeDepartment.$.name][productType.$.id] = productTypeDepartment.$.name;
                            if (!productTypeToDepartmentsMap[productType.$.id]) {
                                productTypeToDepartmentsMap[productType.$.id] = [];
                            }
                            productTypeToDepartmentsMap[productType.$.id].push(productTypeDepartment);
                        }
                    });
                });
            });

        },
        /***
         *
         * @param {sprd.model.ProductTypeDepartment} productTypeDepartment
         * @param {sprd.entity.DepartmentCategory} category
         * @returns {Array}
         */
        getGroupedSizes: function (productTypes, department) {

            function sizeMapToArray(sizeMap, departmentName) {
                var ret = [];
                for (var sizeName in sizeMap) {
                    if (sizeMap.hasOwnProperty(sizeName)) {
                        ret.push({
                            name: sizeName,
                            departmentName: departmentName,
                            productTypes: sizeMap[sizeName].productTypes
                        });
                    }
                }

                return ret;
            }

            var departmentSizeMap = productTypeDepartmentToSizeMap;

            if (productTypes) {
                var departmentHash,
                    key, departments;

                departmentSizeMap = {};
                productTypes.each(function (productType) {
                    if (department) {
                        departments = [department];
                    } else {
                        departments = productTypeToDepartmentsMap[productType.$.id];
                    }
                    if (departments) {
                        for (var i = 0; i < departments.length; i++) {
                            key = departments[i].$.name;
                            departmentHash = departmentSizeMap[key] = departmentSizeMap[key] || {};
                            productType.$.sizes.each(function (size) {
                                if (!departmentHash[size.$.name]) {
                                    departmentHash[size.$.name] = {
                                        productTypes: []
                                    };
                                }
                                departmentHash[size.$.name].productTypes.push(productType);
                            });
                        }
                    }
                });
            }
            var groups = [],
                group;
            for (var departmentName in departmentSizeMap) {
                if (departmentSizeMap.hasOwnProperty(departmentName)) {
                    group = {
                        name: departmentName,
                        items: sizeMapToArray(departmentSizeMap[departmentName], departmentName)
                    };
                    groups.push(group);
                }
            }

            return groups;

        },

        /***
         * Returns true of the productType has the given color
         * @param {sprd.model.ProductType} productType
         * @param {js.type.Color} color
         * @returns {*|boolean}
         */
        hasProductTypeColor: function (productType, color) {
            return color && productTypeToColorMap[productType.$.id] && productTypeToColorMap[productType.$.id].hasOwnProperty(color.toString());
        },

        hasProductTypeSize: function (productType, sizeItem) {
            return sizeItem && departmentProductTypeMap[sizeItem.departmentName] && departmentProductTypeMap[sizeItem.departmentName][productType.$.id] === sizeItem.departmentName && productType.getSizeByName(sizeItem.name);
        },
        /***
         *
         * @param {sprd.model.ProductType} productType
         * @param {js.type.Color} color
         * @returns {*}
         */
        getAppearanceForProductTypeAndColor: function (productType, color) {
            if (color && productType) {
                var colorHash = productTypeToColorMap[productType.$.id],
                    appearances = colorHash[color.toString()];

                if (appearances && appearances.length) {
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
        getColorsForProductTypes: function (productTypes) {

            var colorHash,
                ret = [];
            productTypes.each(function (productType) {
                colorHash = productTypeToColorMap[productType.$.id];
                for (var color in colorHash) {
                    if (colorHash.hasOwnProperty(color)) {
                        if (ret.indexOf(colorMap[color]) === -1) {
                            ret.push(colorMap[color]);
                        }
                    }
                }
            });

            return ret;
        }

    };

});