define(['js/data/Entity', 'js/lib/extension'], function (Entity, extension) {

    // do not remove, as extension is required to have Math.round(number, accuracy)
    var x = extension;

    return Entity.inherit('sprd.entity.Offset', {
        defaults: {
            x: 0,
            y: 0,
            unit: "mm"
        },

        schema: {
            x: Number,
            y: Number,
            unit: String
        },

        compose: function () {
            var ret = this.callBase();

            return {
                x: Math.round(ret.x, 3),
                y: Math.round(ret.y, 3),
                unit: ret.unit
            };

        },

        isDeepEqual: function (a) {
            if (!a) {
                return false;
            }

            return Math.round(this.$.x, 0) === Math.round(a.$.x, 0) &&
                    Math.round(this.$.y, 0) === Math.round(a.$.y, 0) &&
                    this.$.unit === a.$.unit;
        }
    });
});