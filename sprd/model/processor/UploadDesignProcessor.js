define(['js/data/DataSource'], function(DataSource) {

    return DataSource.Processor.inherit("sprd.model.processor.UploadDesignProcessor", {

        _getCompositionValue: function (value, key, action, options) {
            if (typeof File !== "undefined" && value instanceof File) {
                return value;
            }

            return this.callBase();
        }
    });
});