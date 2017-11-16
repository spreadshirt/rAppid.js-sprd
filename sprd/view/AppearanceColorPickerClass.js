define(["js/ui/View", "js/core/I18n"], function (View, I18n) {
    return View.inherit("sprd.view.AppearanceColorPickerClass", {
        inject: {
            i18n: I18n
        },

        defaults: {
            appearance: null,
            showTitle: true,
            productType: null,
            product: null,
            useAppearanceTextures: true
        },

        events: ["on:appearanceSelect"],

        getElement: function(){
            return this.$.productType ? this.$.productType : this.$.product;
        }.onChange('productType', 'product')

    });
});