define(["sprd/data/SprdModel", 'sprd/model/ProductType', 'sprd/entity/Appearance'],
    function (SprdModel, ProductType, Appearance) {
        return SprdModel.inherit("sprd.model.ProductBase", {

            schema: {
                productType: ProductType,
                appearance: {
                    type: Appearance,
                    isReference: true
                },
                restrictions: Object,
                defaultValues: Object
            },

            defaults: {
                productType: null,
                appearance: null,
                view: null
            },

            ctor: function () {
                this.callBase();

            },

            price: function () {
                return this.$.price;
            }.onChange("price"),

            getDefaultView: function () {

                if (this.$.productType) {
                    var defaultViewId = this.getDefaultViewId();

                    if (defaultViewId !== null) {
                        return this.$.productType.getViewById(defaultViewId);
                    } else {
                        return this.$.productType.getDefaultView();
                    }
                }

                return null;

            },

            getDefaultViewId: function () {
                if (this.$.defaultValues) {
                    return this.$.defaultValues.defaultView.id;
                }
                return null;
            },

            getDefaultAppearance: function () {
                if (this.$.appearance && this.$.productType) {
                    return this.$.productType.getAppearanceById(this.$.appearance.$.id);
                }

                return null;
            },

            compose: function () {
                var ret = this.callBase();

                ret.restrictions = {
                    freeColorSelection: false,
                    example: false
                };

                var viewId = this.get("view.id");

                if (viewId) {
                    ret.defaultValues = {
                        defaultView: {
                            id: viewId
                        }
                    }
                }

                return ret;
            }

        });
    });
