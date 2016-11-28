define(['sprd/entity/Scale'], function(Scale) {

    return Scale.inherit('sprd.entity.Offset', {
        defaults: {
            x: 0,
            y: 0,
            unit: "mm"
        },

        schema: {
            unit: String
        },

        isDeepEqual: function (a) {
            return this.callBase() && this.$.unit === a.$.unit;
        }
    });
});


