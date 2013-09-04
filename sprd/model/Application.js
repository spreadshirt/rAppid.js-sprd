define(["sprd/data/SprdModel", "js/data/Entity", 'js/core/List'], function (Model, Entity, List) {
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
            properties: List
        },
        schema: {
            name: String,
            properties: [Property]
        },

        getProperty: function (key) {
            for (var i = 0; i < this.$.properties.length; i++) {
                var property = this.$.properties[i];

                if (property.$.key === key) {
                    return property;
                }
            }

            return null;
        }
    });

    Application.Property = Property;

    return  Application;
});