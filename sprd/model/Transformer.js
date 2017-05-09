define(['sprd/data/SprdModel', "js/data/Entity"], function(SprdModel, Entity) {
    var TransformerResult = Entity.inherit('sprd.model.Transformer.TransformerResult', {
        schema: {
            content: String
        }
    });

    return SprdModel.inherit('sprd.model.Transformer', {
        schema: {
            content: String
        },

        resultType: TransformerResult
    });
});