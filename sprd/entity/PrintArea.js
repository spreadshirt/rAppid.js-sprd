define(['js/data/Entity', 'sprd/model/PrintType', 'sprd/entity/Size'], function (Entity, PrintType, Size) {

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
            restrictions: PrintAreaRestriction,
            boundary: null,
            _size: "{boundary.size}",
            defaultBox: null
        },

        schema: {
            restrictions: PrintAreaRestriction
        },

        getProductType: function () {
            return this.$parent;
        },

        _commit_size: function(size) {
            if (size) {
                this.set("defaultBox", {
                    x: size.width / 6,
                    y: size.height / 7,
                    width: size.width * 4 / 6,
                    height: size.height * 5 / 7
                });
            }
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