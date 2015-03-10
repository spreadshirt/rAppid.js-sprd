define(['js/data/DataSource', 'underscore'], function (DataSource, _) {

    var FETCHSTATE = {
        CREATED: 0,
        LOADING: 1,
        LOADED: 2,
        ERROR: -1
    };

    return DataSource.Processor.inherit("sprd.model.processor.DefaultProcessor", {

        parse: function (model, data, action, options) {

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
        },

        parseCollection: function (collection, data, action, options) {
            var ret = this.callBase(),
                hasAttributeSet = false;

            options = options || {};

            if (options.query && options.query.query && options.query.query.extra && options.query.query.extra.attributeSet) {
                hasAttributeSet = true;
            }

            if (ret && options.fullData === true && !hasAttributeSet) {
                // data fetched with full data and NO attribute set given,
                // then we expect that the model is fully loaded
                for (var i = 0; i < ret.length; i++) {
                    var model = ret[i];
                    var fetch = model._fetch;
                    if (fetch && fetch.state === FETCHSTATE.CREATED && fetch.callbacks.length === 0) {
                        // model is created and no callbacks are registered -> set fetch state
                        fetch.state = FETCHSTATE.LOADED;
                    }

                }
            }

            return ret;
        },

        compose: function () {
            var model = this.callBase();

            if (model.hasOwnProperty('created')) {
                delete(model.created);
            }

            return model;
        }
    });
});