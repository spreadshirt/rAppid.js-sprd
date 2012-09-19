define(["sprd/data/SprdModel", "sprd/entity/ArticleCategoryEntity"], function (Model, ArticleCategoryEntity) {

    return Model.inherit('sprd.model.ArticleCategory', {
        $schema : {
            articleCategories: [ArticleCategoryEntity]
        },
        getSubCategories: function () {
            return this.articleCategories;
        }
    });
});