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
        }
    });


    PrintArea.Restriction = PrintAreaRestriction;

    return PrintArea;
});