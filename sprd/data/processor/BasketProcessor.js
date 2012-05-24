define(['js/data/DataSource'], function(DataSource) {

    return DataSource.Processor.inherit("sprd.data.processor.Basket", {
        serialize: function(data, action) {

            if (action === DataSource.ACTION.CREATE) {
                return {};
            }
        }
    });
});