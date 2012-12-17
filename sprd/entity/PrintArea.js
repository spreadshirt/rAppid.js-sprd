define(['js/data/Entity', 'sprd/model/PrintType'], function (Entity, PrintType) {

    var PrintAreaRestriction = Entity.inherit('sprd.entity.PrintArea.Restriction', {

        defaults: {
            textAllowed: true,
            designAllowed: true,
            excludedPrintTypes: []
        },

        schema: {
            textAllowed: Boolean,
            designAllowed: Boolean,
            excludedPrintTypes: [PrintType]
        }
    });

    var PrintArea = Entity.inherit('sprd.entity.PrintArea', {

        defaults: {
            restrictions: PrintAreaRestriction
        },

        schema: {
            restrictions: PrintAreaRestriction
        },

        getProductType: function () {
            return this.$parent;
        },

        getDefaultView: function () {

            if (this.$.defaultView && this.getProductType()) {
                return this.getProductType().getViewById(this.$.defaultView.id);
            }

            return null;
        }
    });


    PrintArea.Restriction = PrintAreaRestriction;

    return PrintArea;
});