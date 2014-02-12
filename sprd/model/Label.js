define(['sprd/data/SprdModel', 'sprd/model/LabelType'], function (SprdModel, LabelType) {
    return SprdModel.inherit('sprd.model.Label', {
        schema: {
            name: String,
            labelType: LabelType
        },

        getTranslationForLocale: function (locale) {
            var translations,
                translation;

            locale = locale.toLowerCase();

            if (typeof this.$.translations !== 'undefined') {
                translations = this.$.translations;

                for (var i = translations.length; i--;) {
                    translation = translations[i];

                    if (translation.locale.id.toLowerCase() === locale) {
                        return translation.value;
                    }
                }

                return this.$.name;
            } else {
                return this.$.name;
            }
        }.onChange('name')
    });
});