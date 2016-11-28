define(['sprd/entity/Image'], function(Image) {

    return Image.inherit('sprd.entity.BlobImage', {

        schema: {
            blob: Object
        }
    });
});