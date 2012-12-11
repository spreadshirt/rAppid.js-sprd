define(['js/data/Entity'], function(Entity) {
    var Size = Entity.inherit('sprd.entity.Offset', {
        defaults: {
            width: 0,
            height: 0,

            unit: "mm"
        },

        schema: {
            width: Number,
            height: Number,
            unit: String
        }
    });

    Size.empty = new Size();

    return Size
});