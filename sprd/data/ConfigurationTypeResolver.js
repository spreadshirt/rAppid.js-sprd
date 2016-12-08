define(['js/data/TypeResolver'], function (TypeResolver) {

    return TypeResolver.inherit('sprd.data.ConfigurationTypeResolver', {

        ctor: function (options) {
            this.$options = options || {};
        },

        resolve: function (value) {

            var type = value.type,
                properties = value.properties || {};

            if (value.text || (properties.specialText)) {
                type = "specialText";
            } else if (properties.type == "bendingText") {
                type = "bendingText";
            }

            return this.$options.mapping[type];
        }

    });

});