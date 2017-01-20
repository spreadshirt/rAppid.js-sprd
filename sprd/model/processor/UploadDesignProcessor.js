define(['js/data/DataSource'], function(DataSource) {

    return DataSource.Processor.inherit("sprd.model.processor.UploadDesignProcessor", {

        _getCompositionValue: function (value, key, action, options) {
            if ((typeof File !== "undefined" && value instanceof File)
                || (typeof Blob !== "undefined" && value instanceof Blob)) {
                return value;
            }

            return this.callBase();
        }
    });
});