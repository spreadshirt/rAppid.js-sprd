define(["sprd/data/SprdModel"], function (SprdModel) {
    return SprdModel.inherit("sprd.model.ConcreteArticle",{
        defaults: {
            appearance: null,
            size: null,
            article: null
        },
        isEqual: function(concreteArticle){
            return this.$.appearance === concreteArticle.$.appearance &&
                this.$.size === concreteArticle.$.size &&
                this.$.article === concreteArticle.$.article;
        }
    });
});
