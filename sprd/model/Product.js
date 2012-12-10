define([
    "sprd/data/SprdModel",
    'js/core/List',
    'sprd/model/ProductType',
    'js/data/AttributeTypeResolver',
    'sprd/entity/DesignConfiguration',
    'sprd/entity/TextConfiguration',
    'sprd/entity/Appearance',
    'js/data/TypeResolver', 'js/data/Entity', "underscore", "flow"],
    function (SprdModel, List, ProductType, AttributeTypeResolver, DesignConfiguration, TextConfiguration, Appearance, TypeResolver, Entity, _, flow) {
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
                appearance: null,
                view: null,
                configurations: List
            },

            price: function () {
                // TODO format price with currency
                return this.$.price.vatIncluded;
            },

            getDefaultView: function () {

                if (this.$.productType) {
                    var defaultViewId = this.getDefaultViewId();

                    if (defaultViewId !== null) {
                        return this.$.productType.getViewById(defaultViewId);
                    } else {
                        return this.$.productType.getDefaultView();
                    }
                }

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
