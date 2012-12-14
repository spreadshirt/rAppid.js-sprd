define(['js/data/Entity'], function(Entity) {
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

        compose: function(){
            var ret = this.callBase();


            return {
                x: Math.round(ret.x,3),
                y: Math.round(ret.y,3),
                unit: ret.unit
            }

        }
    })
});