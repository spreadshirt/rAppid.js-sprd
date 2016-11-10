define(["sprd/data/SprdModel", "js/data/Collection", "sprd/model/Template"], function(Model, Collection, Template) {

    return Model.inherit('sprd.model.TemplateCategory', {

        defaults: {
            name: null
        },

        schema: {
            name: String,
            templates: Collection.of(Template)
        }
    });

});