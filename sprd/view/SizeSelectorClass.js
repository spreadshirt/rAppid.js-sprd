define(['js/ui/SelectionView'], function(SelectionView) {
    return SelectionView.inherit({
        $classAttributes: ['sizes'],

        defaults: {
            componentClass: 'product-sizes',
            itemKey: 'size',
            // if null use default view
            sizes: null,
            multiSelect: false
        },

        _commitChangedAttributes: function (attributes) {
            if (attributes.sizes) {
                // if the article has the same
                if (attributes.sizes !== this.$items) {
                    this.set('items', attributes.sizes);
                    if (this.$.items.length === 1) {
                        this.set('selectedItem', this.$.items[0]);
                    }
                }
            } else {
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