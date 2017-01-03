define(['sprd/entity/Vector2D', 'js/lib/extension'], function(Vector2D, extension) {

    // do not remove, as extension is required to have Math.round(number, accuracy)
    var x = extension;

    return Vector2D.inherit('sprd.entity.Scale', {
        defaults: {
            x: 1,
            y: 1,
            fixedAspectRatio: false
        },

        schema: {
            fixedAspectRatio: Boolean
        },

        _commitX: function(x) {
            if (this.$.fixedAspectRatio) {
                this.set('y', x);
            }
        },

        _commitY: function(y) {
            if (this.$.fixedAspectRatio) {
                this.set('x', y);
            }
        },

        isDeepEqual: function(a) {
            if (!a) {
                return false;
            }

            return this.callBase() && a.$.fixedAspectRatio === this.$.fixedAspectRatio;
        }
    });
});


