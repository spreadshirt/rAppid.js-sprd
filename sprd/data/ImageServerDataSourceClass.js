define(["sprd/data/SprdDataSource", "js/data/Model", "js/data/RestDataSource", "js/data/DataSource", "sprd/model/processor/UploadDesignProcessor"],
    function (SprdDataSource, Model, RestDataSource, DataSource, UploadDesignProcessor) {

        var _formatProcessorCache = {};

        var ImageServerDataSourceClass = SprdDataSource.inherit('sprd.data.ImageServerDataSourceClass', {

            defaults: {
                parsePayloadOnUpdate: false
            },

            $processors: {
                UploadDesignProcessor: UploadDesignProcessor
            },

            _saveModel: function (model, options, callback) {

                if (model._status() !== Model.STATE.CREATED) {
                    callback("Model isn't created");
                    return;
                }

                this.callBase();

            },

            getFormatProcessor: function (action, model) {
                var type = model.$.image.$.type,
                    format = model.$.image.$.file ? "file" : "remote",
                    cacheId = type + "_" + format;

                if (!_formatProcessorCache[cacheId]) {
                    if (format === "file") {
                        _formatProcessorCache[type] = new ImageServerDataSourceClass.FileSystemImageFormatProcessor(type);
                    } else {
                        _formatProcessorCache[type] = new ImageServerDataSourceClass.RemoteImageFormatProcessor(type);
                    }
                }

                return _formatProcessorCache[type];
            },
            getQueryParameter: function (method, model) {
                return _.defaults({mediaType: model.$.file.type.split("/").pop()}, this.callBase());
            }
        });

        ImageServerDataSourceClass.FileSystemImageFormatProcessor = DataSource.FormatProcessor.inherit({

            ctor: function (type) {
                this.$type = type;
                this.callBase();
            },

            serialize: function (data) {
                var ret = new FormData();
                ret.append('upload_field', data.image.file);
                return ret;
            },

            getContentType: function () {
                return false;
            }
        });

        ImageServerDataSourceClass.RemoteImageFormatProcessor = DataSource.FormatProcessor.inherit({

            ctor: function (type) {
                this.$type = type;
                this.callBase();
            },

            serialize: function (data) {
                return '<reference xmlns="http://api.spreadshirt.net" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + data.image.src + '" />'
            },

            getContentType: function () {
                return false;
            }
        });


        return ImageServerDataSourceClass;
    });