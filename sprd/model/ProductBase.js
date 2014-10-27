define(["sprd/data/SprdModel"],
    function (SprdModel) {
        return SprdModel.inherit("sprd.model.ProductBase", {

            defaults: {
                productType: null,
                appearance: null,
                view: null
            },

            price: function () {
                return this.$.price;
            }.onChange("price"),

            getDefaultView: function () {
                var productType = this.$.productType,
                    viewId = this.get("defaultValues.defaultView.id");

                if (productType) {
                    return productType.getViewById(viewId) || productType.getDefaultView();
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
