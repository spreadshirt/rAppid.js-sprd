define(["sprd/data/IImageUploadService", "js/core/Bus", "xaml!sprd/data/ImageServerDataSource", "flow", "sprd/model/UploadImage",
        "sprd/type/UploadDesign", "underscore", "sprd/entity/FileSystemImage", "sprd/entity/RemoteImage",
        "sprd/entity/Image", "sprd/data/IframeUpload", "sprd/model/Design", "sprd/error/DesignUploadError"],
    function (IImageUploadService, Bus, ImageServerDataSource, flow, UploadImage, UploadDesign, _, FileSystemImage, RemoteImage, Image, iFrameUpload, Design, DesignUploadError) {

        return IImageUploadService.inherit('sprd.data.ImageUploadService', {

            defaults: {
                uploadContext: null
            },

            inject: {
                imageServer: ImageServerDataSource,
                bus: Bus
            },

            /**
             * Upload image to image server and show progress
             *
             * @param {sprd.type.UploadDesign} uploadDesign
             * @param {Object} restrictions
             * @param {Function} [callback]
             * @private
             */
            _uploadDesign: function (uploadDesign, restrictions, callback) {
                var self = this,
                    trackingManager = this.$.trackingManager,
                    message;

                if (restrictions instanceof Function) {
                    callback = restrictions;
                    restrictions = {};
                }
                if (uploadDesign.isVectorMimeType() || uploadDesign.isVectorExtension()) {
                    restrictions.colorCount = 3;
                    uploadDesign.set('isVector', true);
                }

                callback = callback || this.emptyCallback();

                var uploadContext = this.$.uploadContext,
                    imageServer = this.$.imageServer,
                    errorTracked = false;

                if (!uploadContext) {
                    message = "No upload context set. Cancel upload";
                }

                if (!imageServer) {
                    message = "No imageServer available";
                }

                if (message) {
                    uploadDesign.set('state', UploadDesign.State.ERROR);
                    this.log(message, "warn");
                    callback(message);
                    return;
                }

                uploadDesign.set('state', UploadDesign.State.LOADING);


                flow()
                    .seq(function (cb) {
                        // Fetch all designs for the shop (API)
                        uploadContext.fetch(null, cb);
                    })
                    .seq("design", function () {
                        // Create a new design placeholder for the shop (API)
                        var design = uploadContext.getCollection("designs").createItem();
                        design.set("name", uploadDesign.get("image.name"));

                        if (restrictions) {
                            design.set('restrictions', restrictions);
                        }


                        return design;
                    })
                    .seq(function (cb) {
                        this.vars["design"].save(null, function (err) {
                            if (err && trackingManager) {
                                self.triggerError({
                                    code: DesignUploadError.ErrorCodes.DESIGN_SAVE_ERROR,
                                    originalError: err
                                });
                                errorTracked = true;
                            }

                            cb(err);
                        });
                    })
                    .seq(function (cb) {

                        // Upload image to image server

                        var design = this.vars["design"];
                        var uploadImage = imageServer.createEntity(UploadImage, design.$.id);
                        uploadImage.set('image', uploadDesign.$.image);

                        uploadDesign.set({
                            design: design,
                            id: design.$.id
                        });

                        if (uploadDesign.$.image instanceof iFrameUpload) {
                            uploadDesign.$.image.upload({
                                url: self.$.imageServer.$.endPoint + '/designs/' + uploadDesign.$.id,
                                queryParams: '?method=put&apiKey=' + self.$.imageServer.$.apiKey
                            }, cb);
                        } else {
                            uploadImage.save({
                                xhrBeforeSend: function (xhr) {
                                    uploadDesign.set('xhr', xhr);

                                    if (xhr && xhr.upload) {
                                        xhr.upload.onprogress = function (e) {
                                            uploadDesign.set('uploadProgress', 100 / e.total * e.loaded);
                                        };
                                    }

                                    xhr.onload = function () {
                                        uploadDesign.set('uploadProgress', 100);
                                    };
                                }
                            }, cb);
                        }
                    })
                    .exec(function (err) {

                        if (trackingManager) {
                            if (!err) {
                                trackingManager.trackUploadSuccess();
                            } else if (!errorTracked) {
                                self.triggerError({
                                    code: DesignUploadError.ErrorCodes.DESIGN_UPLOAD_ERROR,
                                    originalError: err
                                })
                            }
                        }
                        var state = uploadDesign.$.isVector ? UploadDesign.State.CONVERTING : UploadDesign.State.LOADED;

                        uploadDesign.set('state', err ? UploadDesign.State.ERROR : state);
                        callback && callback(err, uploadDesign);

                    });
            },
            triggerError: function (error) {
                this.$.bus.trigger('ImageUploadService.Error', error, this);
            }
        });
    });
