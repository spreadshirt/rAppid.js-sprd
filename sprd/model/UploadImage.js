define(['sprd/data/SprdModel', 'xaml!sprd/data/ImageServerDataSource'], function(SprdModel, ImageServerDataSource) {
    return SprdModel.inherit('sprd.model.UploadImage', {
        defaults: {
            image: null
        },

        schema: {
            image: Object
        },

        inject: {
            imageServer: ImageServerDataSource
        },

        save: function (options, callback) {
            var imageServerEndPoint = options.imageServerEndPoint || '',
                apiKey = options.apiKey || '';

//            if (window.FileReader) {
//                this.callBase();
//            } else {
                this.createUploadFrame(imageServerEndPoint, apiKey, callback);
//            }
        },

        createUploadFrame: function (imageServerEndPoint, apiKey, callback) {
            var body = document.getElementsByTagName('body')[0],
                frame = document.createElement('iframe'),
                self = this,
                queryParameters;

            frame.width = 0;
            frame.height = 0;

            frame.onload = function () {
                var frameContent = this.contentDocument,
                    frameBody = frameContent.getElementsByTagName('body')[0],
                    uploadForm = document.createElement('form'),
                    inputField = self.$.image.$el;

                queryParameters = '/designs/'+ self.get('id') + '?method=put&apiKey=' + apiKey;

                inputField.name = 'upload_field';

                uploadForm.method = 'post';
                uploadForm.enctype = 'multipart/form-data';
                uploadForm.action = imageServerEndPoint + queryParameters;

                uploadForm.appendChild(inputField);
                frameBody.appendChild(uploadForm);

                alert('foo');

                this.onload = function () {
                    var frameContent = this.contentDocument,
                        frameBody = frameContent.getElementsByTagName('body')[0];

                    if (frameBody.children.length === 0) {
                        console.log('uploaded via iframe');
                        callback(null);
                    } else {
                        callback('Image Upload Error');
                    }
                };

                uploadForm.submit();
            };

            body.appendChild(frame);
        }
    });
});