define(["sprd/data/SprdModel", "js/data/Entity"], function (SprdModel, Entity) {
    return SprdModel.inherit("sprd.model.Message", {

        defaults: {
            type: null,
            content: null
        },

        schema: {
            type: String,
            content: Entity,
            properties: Array
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
            ret.type = content.type;

            delete ret.content;

            return ret;

        }

    });


});
