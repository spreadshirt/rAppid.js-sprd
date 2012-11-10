define(["sprd/data/SprdModel","sprd/entity/DepartmentCategory", "underscore"], function (Model, DepartmentCategory, _) {
    return Model.inherit('sprd.model.ProductTypeDepartment', {
        schema: {
            categories: [DepartmentCategory]
        },

        getProductTypeCategoryById: function(id){
            if(this.$.categories){
                return this.$.categories.each(function(category){
                    if(category.$.id == id){
                        this['return'](category);
                    }
                });
            }
            return null;
        },

        isRealDepartment: function() {

            // FIXME: do it per configuration
            // TODO:

            var platform = 'US',
                excludedDepartmentIds = platform === 'EU' ?  ["10", "8"] : ["7", "6"];

            return _.indexOf(excludedDepartmentIds, this.$.id) === -1;
        }.onChange("id")

    });

});