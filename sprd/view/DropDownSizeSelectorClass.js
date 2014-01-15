define(["xaml!js/ui/MenuButton"], function(MenuButton) {
    return MenuButton.inherit({

        $defaultContentName: null,

        defaults: {
            type: "{btnType()}"
        },

        initialize: function () {
            this.callBase();
            this.bind('change:productType', this._onProductTypeChange, this);
        },

        _onProductTypeChange: function () {
            var sizes = this.get('productType.sizes');
            if (sizes && sizes.length === 1) {
                this.set('selectedSize', sizes.at(0));
            }
        },

        closeMenu: function () {
            this.set('menuVisible', false);
        },

        btnType: function () {
            if (this.$.selectedSize) {
                return 'info';
            }
            return null;
        }.onChange('selectedSize')

    });
});