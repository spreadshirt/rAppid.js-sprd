define(['js/data/Entity', 'sprd/model/PrintType', 'sprd/entity/AppearanceColor'], function(Entity, PrintType, AppearanceColor) {
    return Entity.inherit('sprd.entity.Appearance', {
        schema: {
            name: String,
            printTypes: [PrintType],
            colors: [AppearanceColor]
        }
    })
});