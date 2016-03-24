define(["sprd/data/IImageUploadService", "js/core/Bus", "xaml!sprd/data/SprdApiDataSource", "flow", "sprd/model/DesignUpload",
        "sprd/type/UploadDesign", "underscore",
        "sprd/entity/Image", "sprd/error/DesignUploadError"],
    function(Component, Bus, SprdApiDataSource, flow, DesignUpload, UploadDesign, _, Image, DesignUploadError) {

        return Component.inherit('sprd.data.ImageUploadServiceV2', {

            defaults: {
                uploadContext: null,
                maxRetries: 30,
                retryTimeout: 1000
            },

            inject: {
                api: SprdApiDataSource,
                bus: Bus
            },

            /**
             * Upload image to image server and show progress
             *
             * @param {sprd.type.UploadDesign} uploadDesign
             * @param [restrictions]
             * @param {Function} [callback]
             * @private
             */
            _uploadDesign: function(uploadDesign, restrictions, callback) {


                var self = this,
                    trackingManager = this.$.trackingManager,
                    message;

                if (uploadDesign.isVectorMimeType() || uploadDesign.isVectorExtension()) {
                    uploadDesign.set('isVector', true);
                }

                callback = callback || this.emptyCallback();

                var uploadContext = this.$.uploadContext,
                    api = this.$.api;

                if (!uploadContext) {
                    message = "No upload context set. Cancel upload";
                }

                if (!api) {
                    message = "No api available";
                }

                if (message) {
                    uploadDesign.set('state', UploadDesign.State.ERROR);
                    this.log(message, "warn");
                    callback(message);
                    return;
                }

                uploadDesign.set('state', UploadDesign.State.LOADING);

                flow()
                    .seq("upload", function(cb) {

                        // Upload image to image server

                        var uploadImage = api.root().getContext(self.$.uploadContext).createEntity(DesignUpload);
                        uploadImage.set('image', uploadDesign.$.image);

                        uploadImage.save({
                            xhrBeforeSend: function(xhr) {
                                uploadDesign.set('xhr', xhr);

                                if (xhr && xhr.upload) {
                                    xhr.upload.onprogress = function(e) {
                                        uploadDesign.set('uploadProgress', 100 / e.total * e.loaded);
                                    };
                                }

                                xhr.onload = function() {
                                    uploadDesign.set('uploadProgress', 100);
                                };
                            }
                        }, cb);
                    })
                    .seq(function(cb) {
                        var upload = this.vars.upload,
                            retries = 0,
                            timeout = self.$.retryTimeout,
                            previewImage = null;

                        check();


                        function check () {

                            if (!uploadDesign.$.previewImage && !previewImage && upload.$.images) {
                                previewImage = (_.filter(upload.$.images, function(img) {
                                    return img.type == 'preview'
                                })[0] || {}).href;

                                previewImage && uploadDesign.set('previewImage', previewImage + "?width=200");
                            }

                            if (upload.$.designId) {
                                cb();
                            } else {

                                uploadDesign.set('state', UploadDesign.State.CONVERTING);

                                if (retries > self.$.maxRetries) {
                                    cb("Retries limit reached");
                                } else {
                                    retries++;

                                    if (retries > 5) {
                                        timeout *= 1.2;
                                    }

                                    setTimeout(function() {

                                        upload.fetch({
                                            noCache: true
                                        }, function(err) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                check();
                                            }
                                        });

                                    }, timeout);
                                }
                            }
                        }

                    })
                    .seq(function(cb) {

                        uploadDesign.set('state', UploadDesign.State.LOADED);

                        var upload = this.vars.upload;

                        var designId = (upload.$.designId || "").replace(/^u?/, "u"),
                            design = uploadContext.getCollection("designs").createItem(designId);

                        uploadDesign.set({
                            design: design,
                            designId: designId
                        });

                        design.fetch(cb);
                    })
                    .exec(function(err) {

                        if (trackingManager) {
                            if (!err) {
                                trackingManager.trackUploadSuccess();
                            } else {
                                self.triggerError({
                                    code: DesignUploadError.ErrorCodes.DESIGN_UPLOAD_ERROR,
                                    originalError: err
                                })
                            }
                        }

                        uploadDesign.set('state', err ? UploadDesign.State.ERROR : UploadDesign.State.LOADED);
                        callback && callback(err, uploadDesign);

                    });
            },
            triggerError: function(error) {
                this.$.bus.trigger('ImageUploadService.Error', error, this);
            }
        });
    });
