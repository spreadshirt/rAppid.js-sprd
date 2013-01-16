define(["js/core/Component", "xaml!sprd/data/ImageServerDataSource", "flow", "sprd/model/UploadImage", "sprd/type/UploadDesign", "underscore", 'sprd/entity/FileSystemImage', 'sprd/entity/RemoteImage'], function (Component, ImageServerDataSource, flow, UploadImage, UploadDesign, _, FileSystemImage, RemoteImage) {

    return Component.inherit('sprd.data.ImageUploadService', {

        defaults: {
            uploadContext: null
        },

        inject: {
            imageServer: ImageServerDataSource
        },


        upload: function (data, callback) {

            var image;

            if (_.isString(data)) {
                image = new RemoteImage({
                    src: data
                });
            } else {
                image = new FileSystemImage({
                    file: data
                });
            }

            this._uploadDesign(new UploadDesign({
                image: image
            }), callback);
        },


        _uploadDesign: function (uploadDesign, callback) {
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

                    uploadImage.save({
                        xhrBeforeSend: function (xhr) {
                            if (xhr && xhr.upload) {
                                xhr.upload.onprogress = function (e) {
                                    uploadDesign.set('uploadProgress', 100 / e.total * e.loaded);
                                }
                            }

                            xhr.onload = function () {
                                uploadDesign.set('uploadProgress', 100);
                            }

                        }
                    }, cb);
                })
                .exec(function (err) {
                    uploadDesign.set('state', err ? UploadDesign.State.ERROR : UploadDesign.State.LOADED);
                    callback && callback(err, uploadDesign);

                });

        }


    });

});