define(["js/core/Component", "xaml!sprd/data/ImageServerDataSource", "flow", "sprd/model/UploadImage", "sprd/type/UploadDesign", "underscore", 'sprd/entity/FileSystemImage', 'sprd/entity/RemoteImage', "sprd/entity/Image"],
    function (Component, ImageServerDataSource, flow, UploadImage, UploadDesign, _, FileSystemImage, RemoteImage, Image) {

        return Component.inherit('sprd.data.ImageUploadService', {

            defaults: {
                uploadContext: null
            },

            inject: {
                imageServer: ImageServerDataSource
            },


            upload: function (data, restrictions, callback) {
                var image;

                if (restrictions instanceof Function) {
                    callback = restrictions;
                    restrictions = null;
                }

                if (data instanceof Image || data instanceof HTMLInputElement) {
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
                var self = this;

                if (restrictions instanceof Function) {
                    callback = restrictions;
                    restrictions = null;
                }

                callback = callback || this.emptyCallback();

                var uploadContext = this.$.uploadContext,
                    imageServer = this.$.imageServer;

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
                        this.vars["design"].save(null, cb);
                    })
                    .seq(function (cb) {
                        var design = this.vars["design"];
                        var uploadImage = imageServer.createEntity(UploadImage, design.$.id);
                        uploadImage.set('image', uploadDesign.$.image);

                        uploadDesign.set({
                            design: design,
                            id: design.$.id
                        });

                        if (uploadDesign.$.image instanceof HTMLInputElement) {
                            self._uploadViaIframe(uploadDesign.$.image, cb);
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
                        uploadDesign.set('state', err ? UploadDesign.State.ERROR : UploadDesign.State.LOADED);
                        callback && callback(err, uploadDesign);

                    });
            },

            _uploadViaIframe: function (fileInputField, callback) {
                var body = document.getElementsByTagName('body')[0],
                    frame = document.createElement('iframe'),
                    self = this,
                    queryParameters,
                    imageServer = self.$.imageServer;

                // hide iframe
                frame.width = 0;
                frame.height = 0;
                frame.style.position = 'absolute';
                frame.style.visibility = 'hidden';

                frame.onload = function () {
                    var frameContent = this.contentDocument,
                        frameBody = frameContent.getElementsByTagName('body')[0],
                        uploadForm = document.createElement('form');

                    queryParameters = '/designs/'+ self.get('id') + '?method=put&apiKey=' + imageServer.$.apiKey;

                    fileInputField.name = 'upload_field';

                    uploadForm.method = 'post';
                    uploadForm.enctype = 'multipart/form-data';
                    uploadForm.action = imageServer.$.endPoint + queryParameters;

                    uploadForm.appendChild(fileInputField);
                    frameBody.appendChild(uploadForm);

                    this.onload = function () {
                        var frameContent = this.contentDocument,
                            frameBody = frameContent.getElementsByTagName('body')[0];

                        if (frameBody.children.length === 0) {
                            callback(null);
                        } else {
                            callback('Image Upload Error');
                        }

                        this.parentNode.removeChild(this);
                    };

                    uploadForm.submit();
                };

                body.appendChild(frame);
            }
        });
    });