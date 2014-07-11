define(['js/data/Entity'], function (Entity) {
    return Entity.inherit('sprd.entity.AppearanceBase', {

        getMainColor: function () {
            return this.get("colors[0].value");
        }
    })
});