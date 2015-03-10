define(['sprd/data/SprdModel', 'js/data/Collection', 'sprd/model/Shop', "sprd/model/Design", "sprd/model/ProductType", "sprd/model/Product", "sprd/model/PrintType", "sprd/model/DesignCategory", "sprd/model/Label", "sprd/model/ObjectLabel", "sprd/model/UserAddress"],
    function (SprdModel, Collection, Shop, Design, ProductType, Product, PrintType, DesignCategory, Label, ObjectLabel, UserAddress) {
        return SprdModel.inherit('sprd.model.User', {
            schema: {
                shops: Collection.of(Shop),
                designs: Collection.of(Design),
                products: Collection.of(Product),
                productTypes: Collection.of(ProductType),
                printTypes: Collection.of(PrintType),
                designCategories: Collection.of(DesignCategory),
                labels: Collection.of(Label),
                objectLabels: Collection.of(ObjectLabel),
                addresses: Collection.of(UserAddress)
            }
        });
    });