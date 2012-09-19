define(["js/data/Entity"], function (Entity) {
    var ArticleCategoryEntity;

    ArticleCategoryEntity = Entity.inherit('sprd.entity.ArticleCategoryEntity', {
        getIdsOfSubcategories: function(){
            var ids = [];
            if(this.$.articleCategories){
                this.$.articleCategories.each(function(category){
                    if(category.$.id.indexOf("b") === -1){
                        ids.push(category.$.id);
                    }
                });
            }
            return ids;
        }
    });

    ArticleCategoryEntity.prototype.$schema = {
        articleCategories: [ArticleCategoryEntity]
    };
    return ArticleCategoryEntity;
});