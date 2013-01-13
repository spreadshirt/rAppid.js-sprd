define(['js/ui/View', 'js/core/List', 'sprd/entity/FileSystemImage', 'flow', 'xaml!sprd/data/ImageServerDataSource', 'sprd/model/UploadImage', 'sprd/type/UploadDesign'],
    function (View, List, FileSystemImage, flow, ImageServerDataSource, UploadImage, UploadDesign) {

        return View.inherit('sprd.view.ImageUploadClass', {

            defaults: {
                items: List,
                imageWidth: 100,
                displayNotice: true,

                uploadContext: null
            },

            inject: {
                imageServer: ImageServerDataSource
            },

            _initializationComplete: function () {
                this.callBase();

                var self = this;
                this.$.items.bind('add', function () {
                    self.set('displayNotice', self.$.items.size() === 0);
                });

                this.$.items.bind('remove', function () {
                    self.set('displayNotice', self.$.items.size() === 0);
                });

            },

            dragEnter: function () {
                this.addClass('drag-over');
                return false;
            },

            dragOver: function (e) {
                e.preventDefault();
                return false;
            },

            dragExit: function () {
                this.removeClass('drag-over');
                return false;
            },

            dropImage: function (e) {

                this.removeClass('drag-over');
                if (e && e.$) {
                    e = e.$;

                    if (e.dataTransfer && e.dataTransfer.files.length) {
                        for (var i = 0; i < e.dataTransfer.files.length; i++) {
                            this._addAndUploadFile(e.dataTransfer.files[i]);
                        }
                    }
                }

                e.preventDefault();
                e.stopPropagation();
                return false;

            },

            _addAndUploadFile: function (file) {
                var reader = new FileReader();

                var fileSystemImage = new FileSystemImage({
                    file: file
                });

                var uploadDesign = new UploadDesign({
                    image: fileSystemImage,
                    file: file
                });

                reader.onload = function (evt) {
                    fileSystemImage.set('url', evt.target.result);
                };

                reader.readAsDataURL(file);

                this._addUploadDesign(uploadDesign);
                this._upload(uploadDesign);
            },

            _addUploadDesign: function(uploadDesign) {
                this.$.items.add(uploadDesign, 0);
            },

            _upload: function(uploadDesign) {

                var uploadContext = this.$.uploadContext,
                    imageServer = this.$.imageServer,
                    file = uploadDesign.$.file;

                if (!uploadContext) {
                    uploadDesign.set('state', UploadDesign.State.ERROR);
                    this.log("No upload context set. Cancel upload", "warn");
                    return;
                }

                uploadDesign.set('state', UploadDesign.State.LOADING);

                flow()
                    .seq(function(cb) {
                        uploadContext.fetch(null, cb);
                    })
                    .seq("design", function() {
                        var design = uploadContext.getCollection("designs").createItem();
                        design.set("name", file.name);

                        return design;
                    })
                    .seq(function(cb) {
                        this.vars["design"].save(null, cb);
                    })
                    .seq(function(cb) {
                        var design = this.vars["design"];
                        var uploadImage = imageServer.createEntity(UploadImage, design.$.id);
                        uploadImage.set("file", file);
                        uploadImage.save({
                            xhrBeforeSend: function(xhr) {
                                if (xhr && xhr.upload) {
                                    xhr.upload.onprogress = function (e) {
                                        uploadDesign.set('uploadProgress', 100 / e.total * e.loaded);
                                    }
                                }

                                xhr.onload = function() {
                                    uploadDesign.set('uploadProgress', 100);
                                }

                            }
                        }, cb);
                    })
                    .exec(function(err) {
                        if (!err) {
                            uploadDesign.set('state', UploadDesign.State.LOADED);
                        }
                    });

            }
        });
    });