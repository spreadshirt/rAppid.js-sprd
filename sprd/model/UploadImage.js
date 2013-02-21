define(['sprd/data/SprdModel'], function(SprdModel) {
    return SprdModel.inherit('sprd.model.UploadImage', {
        defaults: {
            image: null
        },

        schema: {
            image: Object
        }
    });
});