define(["js/core/Component", "sprd/entity/FileSystemImage", "sprd/entity/RemoteImage", "sprd/type/UploadDesign", "sprd/data/IframeUpload"], function(Component, FileSystemImage, RemoteImage, UploadDesign, iFrameUpload) {

    return Component.inherit('sprd.data.ImageUploadService', {

        defaults: {
            uploadContext: null
        },

        /**
         * Upload image from local file system
         *
         * @param {sprd.entity.Image | sprd.data.iFrameUpload} data
         * @param {Object} restrictions
         * @param {Function} callback
         * @returns {sprd.type.UploadDesign}
         */
        upload: function(data, restrictions, callback) {

            var image;

            if (restrictions instanceof Function) {
                callback = restrictions;
                restrictions = null;
            }

            if (data instanceof Image || data instanceof iFrameUpload) {
                image = data;
            } else if (_.isString(data)) {
                image = new RemoteImage({
                    src: data
                });
            } else {
                image = new FileSystemImage({
                    file: data
                });
            }

            var uploadDesign = new UploadDesign({
                image: image
            });

            this._uploadDesign(uploadDesign, restrictions, callback);

            return uploadDesign;

        }
    });
});
