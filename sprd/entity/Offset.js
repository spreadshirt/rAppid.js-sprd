define(['sprd/entity/Vector2D'], function(Vector2D) {

    return Vector2D.inherit('sprd.entity.Offset', {
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


