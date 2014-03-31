define(["js/data/Entity","sprd/model/ProductType"], function (Entity, ProductType) {
    var DepartmentCategory;

    DepartmentCategory = Entity.inherit('sprd.entity.DepartmentCategory', {
        containsProductType: function(productTypeId) {

            var productTypes = this.$.productTypes;
            if (productTypes) {
                return !!productTypes.find(function(pt) {
                    return pt.$.id === productTypeId;
                });
            }

            return false;
        }
    });

    DepartmentCategory.prototype.schema = {
        productTypes: [ProductType]
    };
    return DepartmentCategory;
});