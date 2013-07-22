define(["sprd/data/SprdModel", "js/data/Entity"], function (SprdModel, Entity) {
    return SprdModel.inherit("sprd.model.Message", {

        defaults: {
            type: null,
            content: null
        },

        schema: {
            type: {
                type: String,
                generated: true
            },
            content: Entity,
            properties: {
                type: Array,
                generated: true
            }
        },

        compose: function () {
            var ret = this.callBase(),
                properties = [],
                content = ret.content.$;

            for (var key in  content) {
                if (content.hasOwnProperty(key)) {
                    properties.push({
                        key: key,
                        value: content[key]
                    });
                }
            }

            ret.properties = properties;
            ret.type = this.$.content.type;

            delete ret.content;

            return ret;

        }

    });


});
