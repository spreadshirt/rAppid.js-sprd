define(['sprd/data/SprdModel'], function(SprdModel) {
    return SprdModel.inherit('sprd.model.UploadImage', {
        defaults: {
            file: null
        },

        schema: {
            file: Object
        }
    });
});