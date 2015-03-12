define(['sprd/entity/AppearanceBase', 'sprd/model/PrintType', 'sprd/entity/AppearanceColor'], function (Entity, PrintType, AppearanceColor) {
    return Entity.inherit('sprd.entity.Appearance', {

        defaults: {
            texture: false,
            brightness: 100
        },

        schema: {
            name: String,
            printTypes: [PrintType],
            colors: [AppearanceColor],
            texture: Boolean,
            brightness: Number
        }
    })
});