define(["sprd/data/SprdModel", "sprd/model/Design", "js/data/Collection"], function (Model, Design, Collection) {

    var DesignCategory = Model.inherit('sprd.model.DesignCategory', {
        schema: {
            designs: Collection.of(Design)
        },

        isMarketPlace: function () {
            return this.$.type === "MARKETPLACE";
        },

        isShopDesigns: function() {
            return this.$.type === "SHOP";
        },

        isMyDesigns: function() {
            return this.$.type === "MY_DESIGNS"
        },

        isBestseller: function() {
            return this.$.type === "BESTSELLER";
        },

        getSubCategories: function () {
            return this.$.designCategories;
        },

        allowSearch: function() {
            return this.isMarketPlace() || this.isBestseller();
        },

        getSubCategoryById: function (id) {
            return this.$.designCategories.find(function (val) {
                return val.$.id == id;
            });
        },

        hasSubCategories: function () {
            return this.$.designCategories && this.$.designCategories.size();
        }

    });

    DesignCategory.prototype.schema.designCategories = [DesignCategory];

    return DesignCategory;
});