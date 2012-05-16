define(["sprd/data/SprdModel", "sprd/model/Product", "sprd/model/Article"], function (SprdModel, Product, Article) {
    return SprdModel.inherit("sprd.model.ConcreteProduct",{
        defaults: {
            appearance: null,
            size: null,
            item: null
        },
        isEqual: function(concreteProduct){
            return this.$.appearance === concreteProduct.$.appearance &&
                this.$.size === concreteProduct.$.size &&
                this.$.product === concreteProduct.$.product;
        },
        getProduct: function(){
            if(this.$.item instanceof Product){
                return this.$.item;
            }else if(this.$.item instanceof Article){
                return this.$.item.$.product;
            }
            return null;
        }
    });
});
