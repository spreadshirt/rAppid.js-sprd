define(["sprd/data/SprdModel", "js/data/Entity", 'js/core/Bindable'], function (Model, Entity, Bindable) {
    var Property = Entity.inherit('sprd.model.Application.Property', {
        defaults: {
            key: null,
            value: null
        },
        schema: {
            key: String,
            value: Object
        },

        parse: function (data) {
            var ret = this.callBase();

            if (ret.value === 'true') {
                ret.value = true;
            } else if (ret.value === 'false') {
                ret.value = false;
            }

            return ret;
        }
    });

    var Application = Model.inherit('sprd.model.Application', {
        defaults: {
            name: '',
            settings: Bindable
        },

        schema: {
            name: String,
            properties: [Property]
        },

        idField: "name",

        parse: function() {
            var ret = this.callBase();

            var propertyObject = {};

            ret.properties.each(function(property) {
                propertyObject[property.$.key] = property.$.value;
            });

            ret.settings = new this.defaults.settings(propertyObject);
            delete ret.properties;

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

    Application.Property = Property;

    return  Application;
});