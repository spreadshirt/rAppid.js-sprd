define(['js/data/DataSource', 'underscore'], function (DataSource, _) {

    return DataSource.Processor.inherit("sprd.model.processor.DefaultProcessor", {

        parse: function(model, data, action, options) {

            if (this.$dataSource.$.keepRawData) {
                model.$data = _.extend({}, model.$data, data);
            }

            return this.callBase();
        },

        _composeSubModel: function (model, action, options) {
            // we do not want to compose sub models, but rather return a reference to the model
            return {
                id: model.$.id
            }
        }

    });
});