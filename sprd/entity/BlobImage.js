define(['sprd/entity/Image'], function(Image) {

    return Image.inherit('sprd.entity.BlobImage', {

        defaults:{
            filename: "blob.png"
        },

        schema: {
            blob: Object,
            filename: String
        }
    });
});