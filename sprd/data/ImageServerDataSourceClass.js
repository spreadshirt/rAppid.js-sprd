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

                var type = model.$.file.type;

                if (!_formatProcessorCache[type]) {
                    _formatProcessorCache[type] = new ImageServerDataSourceClass.ImageFormatProcessor(type);
                }

                return _formatProcessorCache[type];
            },
            getQueryParameter: function (method, model) {
                return _.defaults({mediaType: model.$.file.type.split("/").pop()}, this.callBase());
            }
        });

        ImageServerDataSourceClass.ImageFormatProcessor = DataSource.FormatProcessor.inherit({

            ctor: function (type) {
                this.$type = type;
                this.callBase();
            },

            serialize: function (data) {
                var ret = new FormData();
                ret.append('upload_field', data.file);
                return ret;
            },

            getContentType: function () {
                return false;
            }
        });

        return ImageServerDataSourceClass;
    });