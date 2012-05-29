define(['js/data/DataSource'], function(DataSource) {

    return DataSource.Processor.inherit("sprd.model.processor.BasketProcessor", {
        compose: function (data, action, options) {
            return this.callBase();
        }
    });
});