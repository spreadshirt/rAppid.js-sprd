define(['js/data/Entity', 'sprd/model/PrintType'], function(Entity, PrintType) {
    return Entity.inherit('sprd.entity.Appearance', {
        schema: {
            name: String,
            printTypes: [PrintType]
        }
    })
});