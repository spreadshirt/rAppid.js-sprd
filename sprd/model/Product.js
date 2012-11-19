define([
    "sprd/data/SprdModel",
    'js/core/List',
    'sprd/model/ProductType',
    'js/data/AttributeTypeResolver',
    'sprd/entity/DesignConfiguration',
    'sprd/entity/TextConfiguration',
    'sprd/entity/Appearance',
    'js/data/TypeResolver', 'js/data/Entity'],
    function (SprdModel, List, ProductType, AttributeTypeResolver, DesignConfiguration, TextConfiguration, Appearance, TypeResolver, Entity) {
        return SprdModel.inherit("sprd.model.Product", {

            schema: {
                productType: ProductType,
                appearance: Appearance,
                configurations: [new AttributeTypeResolver({
                    attribute: "type",
                    mapping: {
                        "design": DesignConfiguration,
                        "text": TextConfiguration
                    }
                })]
            },

            defaults: {
                productType: null,
                configurations: List
            },

            price: function () {
                // TODO format price with currency
                return this.$.price.vatIncluded;
            },
            getDefaultView: function () {
                if (this.$.defaultValues && this.$.productType) {
                    return this.$.productType.getViewById(this.$.defaultValues.defaultView.id);
                }
                return null;
            },
            getDefaultViewId: function(){
                if (this.$.defaultValues) {
                    return this.$.defaultValues.defaultView.id;
                }
                return null;
            },
            getDefaultAppearance: function() {
                if(this.$.appearance && this.$.productType){
                    return this.$.productType.getAppearanceById(this.$.appearance.$.id);
                }
            }
        });
    });
