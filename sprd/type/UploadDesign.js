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
            state: State.NONE
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
        },

        checkDesign: function (cb) {
            if (this.$.design) {
                this.$checkCallbacks = this.$checkCallbacks || [];
                if (cb && this.$checkCallbacks.indexOf(cb) === -1) {
                    this.$checkCallbacks.push(cb);
                }
                var options = {},
                    self = this;
                if (this.get('state') == State.CONVERTING) {
                    options.noCache = true;
                }
                this.$.design.fetch(options, function (err, design) {
                    self.set('designLoaded', true);
                    var timeout;
                    if (!err) {
                        var state = self.$.state;
                        if (design.isVectorDesign()) {
                            if (design.$.designServiceState == Design.DesignServiceState.APPROVED) {
                                state = UploadDesign.State.LOADED;
                            } else if (design.$.designServiceState == Design.DesignServiceState.TO_BE_APPROVED) {
                                state = UploadDesign.State.CONVERTING;
                                self.$checkTimeout && clearTimeout(self.$checkTimeout);
                                self.$checkTimeout = setTimeout(function () {
                                    self.checkDesign();
                                }, 4000);
                                timeout = self.$checkTimeout;
                            } else {
                                state = UploadDesign.State.ERROR;
                                // Some error occurred...
                            }
                            self.set('state', state);
                        }
                    }
                    if (!timeout) {
                        while (self.$checkCallbacks.length) {
                            var callback = self.$checkCallbacks.pop();
                            callback(err, self);
                        }
                    }
                })
            }
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
