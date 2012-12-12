define(['js/data/DataSource'], function (DataSource) {

    return DataSource.Processor.inherit("sprd.model.processor.DefaultProcessor", {
        _composeSubModel: function (model, action, options) {
            // we do not want to compose sub models, but rather return a reference to the model
            return {
                id: model.$.id,
                // TODO: determinate href
                href: model.$.href
            }
        },

        _getIdForValue: function (value) {

            if (value.id && value.href) {
                var id = value.href.split("/").pop();
                if (id) {
                    value.id = id;
                    return id;
                }
            }

            return value.id;
        }

    });
});