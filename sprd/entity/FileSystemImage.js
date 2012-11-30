define(['sprd/entity/Image', 'underscore'], function(Image, _) {

    return Image.inherit('sprd/entity/FileSystemImage', {
        defaults: {
            file: null
        },

        ctor: function(attributes) {
            attributes = attributes || {};

            var file = attributes.file;

            if (file) {
                _.defaults(attributes, {
                    name: file.name,
                    lastModifiedDate: file.lastModifiedDate,
                    type: file.type,
                    size: file.size
                });
            }

            this.callBase(attributes);

        }
    });
});