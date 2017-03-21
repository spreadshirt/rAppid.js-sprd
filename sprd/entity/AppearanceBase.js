define(['js/data/Entity'], function (Entity) {
    return Entity.inherit('sprd.entity.AppearanceBase', {

        getMainColor: function () {
            return this.get("colors[0].value");
        },

        brightness: function() {
            var color = this.getMainColor();

            if (color) {
                return color.distanceTo("#000000") < color.distanceTo("#FFFFFF") ?
                    "dark" : "bright";
            }

            return "";
        }

    })
});