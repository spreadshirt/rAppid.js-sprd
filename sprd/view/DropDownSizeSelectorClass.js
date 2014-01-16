define(["xaml!js/ui/MenuButton"], function (MenuButton) {
    return MenuButton.inherit({

        $defaultContentName: null,

        defaults: {
            type: "{btnType()}",

            /***
             * the product type to show sizes for
             * @type sprd.model.ProductType
             */
            productType: null,

            /***
             * the selected appearance of the product type
             * @type sprd.entity.Appearance
             */
            appearance: null,

            /***
             * the selected size
             * @type sprd.entity.ProductTypeSize
             */
            selectedSize: null,

            _sizes: null
        },

        initialize: function () {
            this.callBase();

            this.bind('productType.stockStates', 'reset', this._buildSizeList, this);
        },

        _commitChangedAttributes: function ($) {

            if (this._hasSome($, ["productType", "appearance"])) {
                this._buildSizeList();
            }

            this.callBase();
        },

        _buildSizeList: function() {
            var sizes;

            var appearance = this.$.appearance,
                productType = this.$.productType;

            if (productType && appearance) {
                sizes = productType.getAvailableSizesForAppearance(appearance);
            }

            this.set("_sizes", sizes);

            if (sizes && sizes.length === 1) {
                this.set("selectedSize", sizes.at(0));
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