define(["js/ui/View"], function(View) {

    return View.inherit({

        defaults: {
            virtualProduct: null,

            perspective: null,

            editable: false,

            componentClass: "virtual-product-view",

            width: 200,
            height: 200
        },

        viewId: function() {
            var virtualProduct = this.$.virtualProduct,
                perspective = this.$.perspective,
                viewId;

            if (!virtualProduct) {
                return null;
            }

            var productType = virtualProduct.$.productType,
                payload = virtualProduct.$.productPayload;

            if (productType) {
                var view = productType.getViewByPerspective(perspective);
                if (view) {
                    viewId = view.$.id;
                }
            }

            if (payload && !viewId) {
                viewId = payload.defaultValues.defaultView.id;
            }

            return viewId;

        }.onChange("virtualProduct.productType", "perspective"),

        view: function() {

            var productType = this.get("virtualProduct.productType");
            if (productType) {
                return productType.getViewByPerspective(this.$.perspective) ||
                    productType.getViewById(this.get("virtualProduct.productPayload.defaultValues.defaultView.id"));
            }

        }.onChange("virtualProduct.productType", "perspective")

    });

});