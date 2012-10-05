define(["sprd/data/SprdModel", "sprd/entity/ArticleCategoryEntity"], function (Model, ArticleCategoryEntity) {

    return Model.inherit('sprd.model.ArticleCategory', {
        schema : {
            articleCategories: [ArticleCategoryEntity]
        },
        getSubCategories: function () {
            return this.articleCategories;
        },
        getSubCategoryById: function(id){
            return this.$.articleCategories.each(function(val){
                if(val.$.id == id){
                    this.return(val);
                }
            });
        }
    });
});