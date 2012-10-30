define(['js/core/List'], function(List){

    return List.inherit('sprd.entity.CategoryGroup', {
        includesDepartment: function(department){
            return !department || false;
        },
        getCategoryByDepartment: function(department){
            var ret = new List();
            this.each(function (category) {
                if (category.$parent === department) {
                    ret.add(category);
                }
            });
            return ret;
        },
        getId: function(){
            var id = [];
            this.each(function (category) {
                id.push(category.$.id);
            });
            return id.join("");
        }
    });

});