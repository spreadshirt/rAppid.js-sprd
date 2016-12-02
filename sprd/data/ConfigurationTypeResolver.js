define(['js/data/TypeResolver'], function (TypeResolver) {

    return TypeResolver.inherit('sprd.data.ConfigurationTypeResolver', {

        ctor: function (options) {
            this.$options = options || {};
        },

        resolve: function (value) {

            var type = value.type;

            if (value.text || (value.properties && value.properties.specialText)) {
                type = "specialText";
            }

            if (value.properties.type == "bendingText") {
                type = "bendingText";
            }

            return this.$options.mapping[type];
        }

    });

});