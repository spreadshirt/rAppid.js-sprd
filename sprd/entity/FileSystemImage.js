define(['sprd/entity/Image'], function(Image) {

    return Image.inherit('sprd/entity/FileSystemImage', {
        defaults: {
            file: null
        }
    });
});