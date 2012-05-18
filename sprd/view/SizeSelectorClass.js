define(['js/ui/SelectionView'], function(SelectionView) {
    return SelectionView.inherit({
        $classAttributes: ['productType'],

        defaults: {
            componentClass: 'product-sizes',
            itemKey: 'size',
            // if null use default view
            productType: null,
            multiSelect: false
        },
        _commitChangedAttributes: function (attributes) {
            if (attributes.productType && attributes.productType.$.views) {
                // if the article has the same
                if (attributes.productType.$.sizes !== this.$items) {
                    this.set('items', attributes.productType.$.sizes);
                    if (this.$.items.length === 1) {
                        this.set('selectedItem', this.$.items[0]);
                    }
                }
            } else if (attributes.productType === null) {
                // set items to null
                // this.set({needsSelection: false, selectedItem: null});
                this.set('items', []);

            }

            this.callBase();
        },
        selectSize: function (e, element) {
            this.set('selectedItem', element.find('$size'));
        }
    })
});