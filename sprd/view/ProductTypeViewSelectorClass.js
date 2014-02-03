define(["js/ui/SelectionView"], function(SelectionView) {

    return SelectionView.inherit("sprd.view.ProductTypeViewSelectorClass", {

        defaults: {
            componentClass: 'product-views',
            tagName: 'ul',
            itemKey: 'view',
            // if null use default view
            product: null,
            $product: null,
            $appearance: null,
            appearance: null,
            needsSelection: true,
            multiSelect: false
        },

        _commitChangedAttributes: function (attributes) {
            if (attributes.product) {
                // if the article has the same
                if (attributes.product.$.productType.$.views.$items === this.$items) {
                    this.set({
                        $product: attributes.product,
                        $appearance: attributes.appearance || this.$.$appearance
                    });
                } else {
                    this.set({$product: attributes.product, $appearance: attributes.appearance || this.$.$appearance}, {silent: true});
                    this.set('items', attributes.product.$.productType.$.views.$items);
                }
            } else if (attributes.article === null) {
                // set items to null
                this.set('items', []);
            } else if (attributes.appearance) {
                this.set({
                    $appearance: attributes.appearance
                });
            } else if (attributes.selectedItem) {

            }

            this.callBase();
        }

    });

});