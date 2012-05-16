define(['js/ui/View','sprd/model/Product', 'Raphael'], function(View, Product, Raphael){

    return View.inherit('sprd.view.ProductViewer',{
        $classAttributes: ['productType','product','appearance'],
        defaults: {
            height: 300,
            width: 300,
            view: null
        },
        ctor: function () {
            this.callBase();

            this.$.product = this.$.product || new Product();
        },
        render: function(){
            var el = this.callBase();

            return el;
        },
        _renderAppearance: function(appearance){
            // TODO: implement
        },
        _renderView: function(view, oldView){
            if(view){
                if (!this.$paper) {
                    this.$paper = Raphael(this.$el, view.$.size.width, view.$.size.height);
                }

                this.$paper.clear();
                this.$paper.width = view.$.size.width;
                this.$paper.height = view.$.size.height;

                this.$printAreas = [];
                // for each print area
                for(var i = 0 ; i < view.$.viewMaps.length; i++){
                    this.$printAreas.push(this._createPrintArea(view.$.viewMaps[i]));
                }

            }
        },
        _createPrintArea: function(printArea){
            return this.$paper.rect(printArea.offset.x,printArea.offset.y, printArea.boundary.size.width, printArea.boundary.size.height);
        }
    });


});