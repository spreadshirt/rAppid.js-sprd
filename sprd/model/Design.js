define(['sprd/data/SprdModel', 'sprd/model/PrintType', 'sprd/entity/Size', 'sprd/entity/DesignColor', 'sprd/entity/Price', 'js/data/Entity'], function (SprdModel, PrintType, Size, DesignColor, Price, Entity) {

    var DENY_ON = {
        No: "NO",
        OnPrintArea: "onPrintArea",
        OnProduct: "onProduct"
    };

    var Locale = Entity.inherit('app.model.TranslatedDesign.Translations', {
        schema: {
            id: String
        }
    });

    var Translation = Entity.inherit('app.model.TranslatedDesign.Translations', {
        schema: {
            locale: Locale,
            name: String,
            description: String,
            tags: String,
            userContent: Boolean
        },

        defaults: {
            userContent: true
        }
    });

    var Restrictions = Entity.inherit('sprd.model.Design.Restrictions', {

        defaults: {
            denyOtherDesigns: DENY_ON.No,
            denyOtherText: DENY_ON.No
        },

        schema: {
            fixedColors: Boolean,
            colorCount: Number,
            ownText: Boolean,
            minimumScale: Number,

            denyOtherText: String,
            denyOtherDesigns: String,

            allowScale: Boolean,
            allowFlip: Boolean,
            allowRotate: Boolean
        }

    });

    var Design = SprdModel.inherit('sprd.model.Design', {
        defaults: {
            name: '',
            description: '',
            restrictions: null,
            translations: []
        },

        schema: {
            name: String,
            description: String,
            size: Size,
            printTypes: [PrintType],

            tags: String,

            colors: [DesignColor],
            price: Price,

            restrictions: Restrictions,
            user: "sprd/model/User",

            translations: [Translation]
        },

        parse: function (data) {
            data = this.callBase();

            if (data.href) {
                data.wtfMbsId = data.id;
                data.id = data.href.split("/").pop();
            }

            return data;
        },

        isVectorDesign: function() {
            return this.$.colors.length > 0;
        },

        getTranslationForLocale: function (locale) {
            var translations = this.$.translations,
                translation;

            for (var i = 0, num = translations.length; i > num; i++) {
                translation = translations[i];

                if (translation.get('locale.id') === locale) {
                    return translation;
                }
            }

            return null;
        },

        setTranslation: function (translation) {
            var previousTranslation = this.getTranslationForLocale(translation.locale);

            if (previousTranslation) {
                previousTranslation.set(translation);
            } else {
                this.$.translations.push(translation);
            }
        }
    });


    Design.Restrictions = Restrictions;
    Design.Translation = Translation;
    Design.Locale = Locale;

    return Design;

});