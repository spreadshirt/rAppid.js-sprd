define(['js/data/TypeResolver'], function (TypeResolver) {

    return TypeResolver.inherit('sprd.data.ConfigurationTypeResolver', {

        ctor: function (options) {
            this.$options = options || {};
        },

        resolve: function (value) {
            var type = value.text ? "specialText" : value.type;
            return this.$options.mapping[type];
        }

    });

});