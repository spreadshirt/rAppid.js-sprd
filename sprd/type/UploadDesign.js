define(["js/core/Bindable", "sprd/model/Design"], function (Bindable, Design) {

    var State = {
        ERROR: "error",
        LOADING: "loading",
        LOADED: "loaded",
        CONVERTING: "converting",
        REJECTED: "rejected",
        NEED_APPROVAL: "need_approval",
        NONE: "none"
    };

    var UploadDesign = Bindable.inherit("sprd.type.UploadDesign", {

        defaults: {
            design: null, // sprd.model.Design
            image: null, // sprd.entity.Image
            uploadProgress: 0,
            xhr: null,
            designLoaded: false,
            isPrintable: true,
            isVector: false,
            isBackgroundRemovalPossible: false,
            state: State.NONE,
            retries: 0,
            previewImage: null
        },

        cancelUpload: function () {
            var xhr = this.$.xhr,
                self = this;

            if (xhr) {
                xhr.abort();
            } else {
                this.bind('change:xhr', function abortXhr() {
                    xhr.abort();
                    self.unbind('change:xhr', abortXhr);
                });
            }
        },

        /**
         * Checks if the mime type belongs to a vector file.
         *
         * @returns {boolean}
         */
        isVectorMimeType: function () {
            return UploadDesign.isVectorMimeType(this.$.image.$.type);
        },

        /**
         * Checks if the file name matches a correct extension for a vector file.
         *
         * @returns {boolean}
         */
        isVectorExtension: function () {
            return UploadDesign.isVectorExtension(this.$.image.$.name);
        },


        /**
         * Checks if the mime type belongs to a uploadable file.
         *
         * @returns {boolean}
         */
        isAllowedMimeType: function () {
            return UploadDesign.isAllowedMimeType(this.$.image.$.type);
        },

        /**
         * Checks if the file name matches a correct extension for a uploadable file.
         *
         * @returns {boolean}
         */
        isAllowedExtension: function () {
            return UploadDesign.isAllowedExtension(this.$.image.$.name);
        }
    }, {

        /**
         * Checks if the mime type belongs to a vector file.
         *
         * @param {String} mimeType
         * @returns {boolean}
         */
        isVectorMimeType: function (mimeType) {
            var validMimeTypes = ["image/svg+xml", "application/postscript"];

            return validMimeTypes.indexOf(mimeType) != -1;
        },

        /**
         * Checks if the file name matches a correct extension for a vector file.
         *
         * @param {String} fileName
         * @returns {boolean}
         */
        isVectorExtension: function (fileName) {
            fileName = (fileName || "").toLowerCase();
            var validExtensions = ["svg", "cdr", "eps", "ai"],
                fileExtension = fileName.substr(fileName.lastIndexOf('.') + 1);

            return validExtensions.indexOf(fileExtension) != -1;
        },

        /**
         * Checks if the mime type belongs to a uploadable file.
         *
         * @param {String} mimeType
         * @returns {boolean}
         */
        isAllowedMimeType: function (mimeType) {
            var imageMimeType = /^image.*/i;

            return UploadDesign.isVectorMimeType(mimeType) || imageMimeType.exec(mimeType);
        },

        /**
         * Checks if the file name matches a correct extension for a uploadable file.
         *
         * @param {String} fileName
         * @returns {boolean}
         */
        isAllowedExtension: function (fileName) {
            fileName = (fileName || "").toLowerCase();
            var validExtensions = ["svg", "cdr", "eps", "ai", "jpg", "jpeg", "gif", "png", "bmp"],
                fileExtension = fileName.substr(fileName.lastIndexOf('.') + 1);

            return validExtensions.indexOf(fileExtension) != -1;
        }
    });

    UploadDesign.State = State;

    return UploadDesign;
});
