define(['sprd/data/SprdModel', 'sprd/model/PrintType', 'sprd/entity/Size', 'sprd/entity/DesignColor', 'sprd/entity/Price', 'js/data/Entity', 'sprd/model/Locale', 'js/core/List'], function (SprdModel, PrintType, Size, DesignColor, Price, Entity, Locale, List) {

    var DENY_ON = {
        No: "NO",
        OnPrintArea: "onPrintArea",
        OnProduct: "onProduct"
    };

    var DesignServiceState = {
        APPROVED: "APPROVED",
        TO_BE_APPROVED: "TO_BE_APPROVED",
        REJECTED: "REJECTED",
        TO_BE_APPROVED_BY_USER: "TO_BE_APPROVED_BY_USER"
    };

    var Translation = Entity.inherit('app.model.TranslatedDesign.Translation', {
        schema: {
            locale: Locale,
            name: String,
            description: String,
            tags: String,
            userContent: Boolean,
            version: Number
        },

        defaults: {
            name: '',
            description: '',
            tags: '',
            userContent: true,
            version: null
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
            designServiceState: null
        },

        schema: {
            name: String,
            description: String,
            size: Size,
            printTypes: [PrintType],

            tags: String,

            colors: [DesignColor],
            backgroundColor: String,

            price: Price,

            restrictions: Restrictions,
            user: "sprd/model/User",

            designServiceState: {
                required: false,
                type: String
            },

            translations: [Translation],

            resources: Object
        },

        parse: function (data) {
            data = this.callBase();

            data.colors = data.colors || new List();

            if (data.href) {
                data.wtfMbsId = data.id;
                data.id = data.href.split("/").pop();
            }

            return data;
        },

        isVectorDesign: function () {
            return this.$.colors.length > 0;
        },

        hasBackgroundColor: function () {

            if (this.$hasBackgroundColor === true || this.$.backgroundColor) {
                return true;
            }

            if (!this.$hasBackgroundColor === false) {
                // already search
                return false;
            }

            var ret = false;

            // requesting without fullData will not give us a payload for
            // background color or not, that's why we search within resources

            var resources = this.$.resources;
            if (resources instanceof Array) {
                for (var i = 0; i < resources.length; i++) {
                    var obj = resources[i];
                    if (obj && obj.href && /backgroundColor/.test(obj.href)) {
                        ret = true;
                        break;
                    }
                }
            }

            this.$hasBackgroundColor = ret;
            return ret;

        }.onChange("backgroundColor"),

        getTranslationForLocale: function (locale) {
            var translations = this.$.translations,
                translation;

            if (translations) {
                for (var i = 0, num = translations.length; i > num; i++) {
                    translation = translations[i];

                    if (translation.get('locale.id') === locale) {
                        return translation;
                    }
                }
            }

            return null;
        },

        setTranslation: function (translation) {
            var locale = translation.get('locale'),
                previousTranslation;

            if (!locale) {
                this.log('no locale set; translation not saved', 'warn');
                return;
            }

            previousTranslation = this.getTranslationForLocale(locale);

            if (previousTranslation) {
                previousTranslation.set(translation);
            } else {
                if (!this.get('translations')) {
                    this.$.translations = [];
                }

                this.$.translations.push(translation);
            }
        }
    });


    Design.DesignServiceState = DesignServiceState;
    Design.Restrictions = Restrictions;
    Design.Translation = Translation;
    Design.Locale = Locale;

    return Design;

});