define(["js/core/Component", "xaml!sprd/data/ImageServerDataSource", "flow", "sprd/model/UploadImage", "sprd/type/UploadDesign", "underscore", 'sprd/entity/FileSystemImage', 'sprd/entity/RemoteImage', "sprd/entity/Image", 'sprd/data/IframeUpload', 'sprd/manager/TrackingManager'],
    function (Component, ImageServerDataSource, flow, UploadImage, UploadDesign, _, FileSystemImage, RemoteImage, Image, iFrameUpload, TrackingManager) {

        return Component.inherit('sprd.data.ImageUploadService', {

            defaults: {
                uploadContext: null
            },

            inject: {
                imageServer: ImageServerDataSource,
                trackingManager: TrackingManager
            },

            upload: function (data, restrictions, callback) {
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
            },


            _uploadDesign: function (uploadDesign, restrictions, callback) {
                var self = this,
                    trackingManager = this.$.trackingManager;

                if (restrictions instanceof Function) {
                    callback = restrictions;
                    restrictions = {};
                }
                if (uploadDesign.$.image.$.type == 'image/svg+xml') {
                    restrictions.colorCount = 3;
                }

                callback = callback || this.emptyCallback();

                var uploadContext = this.$.uploadContext,
                    imageServer = this.$.imageServer,
                    errorTracked = false;

                var message;

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
                        uploadContext.fetch(null, cb);
                    })
                    .seq("design", function () {
                        var design = uploadContext.getCollection("designs").createItem();
                        design.set("name", uploadDesign.get("image.name"));

                        if (restrictions) {
                            design.set('restrictions', restrictions);
                        }

                        return design;
                    })
                    .seq(function (cb) {
                        this.vars["design"].save(null, function(err) {
                            if (err && trackingManager) {
                                trackingManager.trackUploadDesignCreationFailed(err);
                                errorTracked = true;
                            }

                            cb(err);
                        });
                    })
                    .seq(function (cb) {
                        var design = this.vars["design"];
                        var uploadImage = imageServer.createEntity(UploadImage, design.$.id);
                        uploadImage.set('image', uploadDesign.$.image);

                        uploadDesign.set({
                            design: design,
                            id: design.$.id
                        });

                        if (uploadDesign.$.image instanceof iFrameUpload) {
                            uploadDesign.$.image.upload({
                                url : self.$.imageServer.$.endPoint + '/designs/' + uploadDesign.$.id,
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
                                trackingManager.trackUploadFailed(err);
                            }
                        }

                        uploadDesign.set('state', err ? UploadDesign.State.ERROR : UploadDesign.State.LOADED);
                        callback && callback(err, uploadDesign);

                    });
            }
        });
    });
