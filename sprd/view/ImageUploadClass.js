define(['js/ui/View', 'js/core/List', 'sprd/entity/FileSystemImage', 'flow', 'xaml!sprd/data/ImageServerDataSource', 'sprd/model/UploadImage', 'sprd/type/UploadDesign', 'sprd/data/ImageUploadService'],
    function (View, List, FileSystemImage, flow, ImageServerDataSource, UploadImage, UploadDesign, ImageUploadService) {

        return View.inherit('sprd.view.ImageUploadClass', {

            defaults: {
                items: List,
                imageWidth: 100,
                displayNotice: true,

                uploadContext: null
            },

            inject: {
                imageServer: ImageServerDataSource,
                imageUploadService: ImageUploadService
            },

            _initializationComplete: function () {
                this.callBase();

                var self = this,
                    eventHandler = function () {
                        self.set('displayNotice', self.$.items.size() === 0);
                    };

                this.$.items.bind('add', eventHandler);
                this.$.items.bind('remove', eventHandler);
                this.$.items.bind('reset', eventHandler);

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

            _addAndUploadFile: function (file, callback) {
                var uploadDesign = this.uploadFile(file, callback);
                this._addUploadDesign(uploadDesign);
            },

            uploadFile: function(file, callback) {

                var self = this,
                    reader = new FileReader();

                var fileSystemImage = new FileSystemImage({
                    file: file
                });

                var uploadDesign = new UploadDesign({
                    image: fileSystemImage
                });

                reader.onload = function (evt) {
                    fileSystemImage.set('url', evt.target.result);
                };

                reader.readAsDataURL(file);
                this.$.imageUploadService._uploadDesign(uploadDesign, function(err) {
                    if (!err) {
                        uploadDesign.set('state', UploadDesign.State.LOADED);
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

                return uploadDesign;
            },

            _addUploadDesign: function (uploadDesign) {
                this.$.items.add(uploadDesign, 0);
            }
        });
    });