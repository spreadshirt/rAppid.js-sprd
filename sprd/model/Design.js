define(['sprd/data/SprdModel', 'sprd/model/PrintType', 'sprd/entity/Size', 'sprd/entity/DesignColor', 'sprd/entity/Price', 'js/data/Entity'], function (SprdModel, PrintType, Size, DesignColor, Price, Entity) {

    var DENY_ON = {
        No: "no",
        OnPrintArea: "onPrintArea",
        OnProduct: "onProduct"
    };

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
            restrictions: null
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
            user: "sprd/model/User"
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
        }
    });


    Design.Restrictions = Restrictions;



    return Design;

});