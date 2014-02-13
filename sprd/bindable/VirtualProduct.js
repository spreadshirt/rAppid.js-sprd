define(["js/core/Bindable"], function(Bindable) {

    return Bindable.inherit("sprd.bindable.VirtualProduct", {

        defaults: {
            /***
             * the original product
             * @type sprd.model.Product
             */
            originalProduct: null,

            /***
             * the transformed product
             * @type sprd.model.Product
             */
            product: null,

            /***
             * the new product type
             * @type sprd.model.ProductType
             */
            productType: null,

            /***
             * the virtual product string to request an image from the image server
             * @type String
             */
            vpString: null
        },

        name: function() {
            return this.get("originalProduct.name")
        }.onChange("originalProduct.name")

    });

});