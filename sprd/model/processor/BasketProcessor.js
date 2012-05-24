define(['js/data/DataSource'], function(DataSource) {

    return DataSource.Processor.inherit("sprd.model.processor.BasketProcessor", {
        serialize: function(data, action) {

            if (action === DataSource.ACTION.CREATE) {
                return {};
            }
        }
    });
});