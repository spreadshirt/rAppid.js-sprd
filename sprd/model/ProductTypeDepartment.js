define(["sprd/data/SprdModel","sprd/entity/DepartmentCategory"], function (Model, DepartmentCategory) {
    return Model.inherit('sprd.model.ProductTypeDepartment', {
        schema: {
            categories: [DepartmentCategory]
        },
        getProductTypeCategoryById: function(id){
            if(this.$.categories){
                return this.$.categories.each(function(category){
                    if(category.$.id == id){
                        this.return(category);
                    }
                });
            }
            return null;
        },
        isRealDepartment: function(){
            return this.$.id != 10 && this.$.id != 8;
        }.onChange("id")

    });

});