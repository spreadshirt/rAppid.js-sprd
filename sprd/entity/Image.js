define(['js/data/Entity'], function(Entity) {

    return Entity.inherit('sprd/data/Image', {
        defaults: {
            url: null,
            name: null,
            width: 0,
            height: 0
        }
    })
});