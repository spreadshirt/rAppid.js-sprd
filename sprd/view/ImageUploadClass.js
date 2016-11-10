define(["js/ui/View", "js/core/List", "flow", "xaml!sprd/data/ImageServerDataSource",
        "sprd/type/UploadDesign", "sprd/data/IImageUploadService", "js/core/I18n"],
    function (View, List, flow, ImageServerDataSource, UploadDesign, IImageUploadService, I18n) {

        return View.inherit("sprd.view.ImageUploadClass", {

            defaults: {
                items: List,
                imageWidth: 100,
                displayNotice: true,
                _displayNotice: false,

                uploadContext: null,

                enabled: true,

                notice: "Drop your files here."
            },

            inject: {
                i18n: I18n,
                imageServer: ImageServerDataSource,
                imageUploadService: IImageUploadService
            },

            _initializationComplete: function () {
                this.callBase();

                var self = this,
                    eventHandler = function () {
                        self.set('_displayNotice', self.$.items.size() === 0);
                    };

                this.$.items.bind('add', eventHandler);
                this.$.items.bind('remove', eventHandler);
                this.$.items.bind('reset', eventHandler);

                eventHandler();

            },

            dragEnter: function () {
                if (this.$.enabled) {
                    this.addClass('drag-over');
                }
                return false;
            },

            displayNotice: function () {
                return this.$.enabled && this.$._displayNotice && this.$.displayNotice;
            }.onChange("displayNotice", "_displayNotice", "enabled"),

            dragOver: function (e) {
                e.preventDefault();
                return false;
            },

            dragExit: function () {
                if (this.$.enabled) {
                    this.removeClass('drag-over');
                }
                return false;
            },

            /**
             * An image has been dropped into the design window.
             *
             * @param {Event} e
             * @returns {boolean}
             */
            dropImage: function (e) {
                if (this.$.enabled) {
                    this.removeClass('drag-over');
                    if (e && e.$) {
                        e = e.$;

                        if (e.dataTransfer && e.dataTransfer.files.length) {
                            for (var i = 0; i < e.dataTransfer.files.length; i++) {
                                this._addAndUploadFile(e.dataTransfer.files[i]);
                            }
                        }
                    }
                }
                e.preventDefault();
                e.stopPropagation();

                return false;
            },

            /**
             * Upload image and add it to the list of our designs.
             *
             * @param {File} file
             * @param {Function} [callback]
             * @private
             */
            _addAndUploadFile: function (file, callback) {
                var uploadDesign = this.uploadFile(file, callback);
                this._addUploadDesignToList(uploadDesign);
            },

            /**
             * @param {sprd.data.iFrameUpload} iFrameUpload
             * @param {Function} [callback]
             * @private
             */
            _addAndUploadFallbackFile: function (iFrameUpload, callback) {

                var self = this;

                var uploadDesign = new UploadDesign({
                    image: iFrameUpload
                });

                this.$.imageUploadService._uploadDesign(uploadDesign, null, function (err) {
                    if (!err) {
                        self.trigger("uploadComplete", {
                            uploadDesign: uploadDesign
                        });

                        uploadDesign.trigger("imageUrlChanged");
                    } else {
                        self.trigger("uploadError", {
                            error: err,
                            uploadDesign: uploadDesign
                        });
                    }

                    callback && callback(err, uploadDesign);
                });


                this._addUploadDesignToList(uploadDesign);
            },

            /**
             * Upload image to Spreadshirt platform.
             *
             * @param {File} file
             * @param {Function} [callback]
             * @returns {sprd.type.UploadDesign}
             */
            uploadFile: function (file, callback) {

                var self = this,
                    reader = new FileReader();

                var uploadDesign = this.$.imageUploadService.upload(file, function (err) {
                    if (!err) {
                        self.trigger("uploadComplete", {
                            uploadDesign: uploadDesign
                        });
                    } else {
                        self.trigger("uploadError", {
                            error: err,
                            uploadDesign: uploadDesign
                        });
                    }

                    callback && callback(err, uploadDesign);
                });

                reader.onload = function(evt) {

                    var img = new Image();
                    img.onload = function() {
                        uploadDesign.set({
                            previewImage: evt.target.result,
                            localImage: evt.target.result
                        });
                    };
                    img.src = evt.target.result;

                };

                reader.readAsDataURL(file);


                return uploadDesign;
            },

            /**
             * Add a design image to the list of our designs.
             *
             * @param {sprd.type.UploadDesign} uploadDesign
             * @private
             */
            _addUploadDesignToList: function (uploadDesign) {
                this.$.items.unshift(uploadDesign);
            }
        });
    });
