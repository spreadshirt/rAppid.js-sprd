define(["js/data/Entity","sprd/model/ProductType"], function (Entity, ProductType) {
    var DepartmentCategory;

    DepartmentCategory = Entity.inherit('sprd.entity.DepartmentCategory', {

    });

    DepartmentCategory.prototype.schema = {
        productTypes: [ProductType]
    };
    return DepartmentCategory;
});