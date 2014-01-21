define(["js/ui/View", "js/core/I18n"], function (View, I18n) {
    return View.inherit("sprd.view.AppearanceColorPickerClass", {
        inject: {
            i18n: I18n
        },

        defaults: {
            appearance: null,
            productType: null
        },

        events: ["on:appearanceSelect"],

        initialize: function () {
            this.bind('change:productType', this._onProductTypeChange, this);
            this.callBase();
        },

        _handleAppearanceSelect: function(e){
            var appearance = e.target.find("appearance");
            this.set('selectedItem', appearance);
            this.trigger("on:appearanceSelect", appearance);
        },

        _onProductTypeChange: function () {
            var productType = this.$.productType,
                appearances;

            if (!productType) {
                this.set('_appearances', null);
            } else {
                appearances = productType.$.appearances;
                if (appearances !== this.$.items) {
                    this.set('_appearances', appearances);
                }
            }
        }
    });
});