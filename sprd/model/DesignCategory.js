define(["sprd/data/SprdModel", "sprd/model/Design", "js/data/Collection"], function (Model, Design, Collection) {

    var DesignCategory = Model.inherit('sprd.model.DesignCategory', {
        schema : {
            designs: Collection.of(Design)
        },
        isMarketPlace: function(){
            return this.$.id === "b1000000";
        },
        getSubCategories: function () {
            return this.$.designCategories;
        },
        getSubCategoryById: function (id) {
            return this.$.designCategories.each(function (val) {
                if (val.$.id == id) {
                    this['return'](val);
                }
            });
        },
        parse: function(data){
            data.id = "b" + data.id;
            return data;
        }
    });

    DesignCategory.prototype.schema.designCategories =[DesignCategory];

    return DesignCategory;
});