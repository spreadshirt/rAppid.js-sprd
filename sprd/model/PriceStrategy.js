define(["sprd/data/SprdModel", "js/data/Entity", 'js/core/Bindable'], function(Model, Entity, Bindable) {
    var Parameter = Entity.inherit('sprd.model.PriceStrategy.Parameter', {
        defaults: {
            name: null,
            value: null
        },
        schema: {
            name: String,
            value: Object
        }
    });

    var PriceStrategy = Model.inherit('sprd.model.PriceStrategy', {
        defaults: {
            type: '',
            settings: Bindable
        },

        schema: {
            type: String,
            parameters: [Parameter]
        },

        parse: function() {
            var ret = this.callBase();

            var parameterObject = {};

            var parameters = ret.parameters;
            parameters && parameters.each(function(property) {
                var value = property.$.value;

                if (!isNaN(parseFloat(value))) {
                    value = parseFloat(value);
                }

                parameterObject[property.$.name] = value;
            });

            ret.settings = new this.defaults.settings(parameterObject);
            delete ret.parameters;

            return ret;
        },

        compose: function() {
            var ret = this.callBase(),
                properties = [],
                settings = this.get("settings.$");

            if (settings) {
                for (var key in settings) {
                    if (settings.hasOwnProperty(key)) {
                        properties.push({
                            key: key,
                            value: settings[key]
                        });
                    }
                }
            }

            ret.properties = properties;

            return ret;
        }

    });

    PriceStrategy.Parameter = Parameter;

    return PriceStrategy;
});