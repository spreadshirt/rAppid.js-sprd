define(["sprd/data/SprdModel", "sprd/model/Design", "js/data/Collection", "js/core/List"], function (Model, Design, Collection, List) {

    var DesignCategory = Model.inherit('sprd.model.DesignCategory', {
        schema: {
            designs: Collection.of(Design)
        },
        defaults: {
            designCategories: List
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

        getCategoryById: function(id) {

            if (id == this.$.id) {
                return this;
            }

            var subCategories = this.$.designCategories;

            if (subCategories) {
                for (var i = 0; i < subCategories.$items.length; i++) {
                    var category = subCategories.$items[i].getCategoryById(id);

                    if (category) {
                        return category;
                    }
                }
            }

            return null;
        },

        getSubCategoryById: function (id) {
            return this.$.designCategories.find(function (val) {
                return val.$.id == id;
            });
        },

        hasSubCategories: function () {
            return this.$.designCategories && this.$.designCategories.size();
        },

        getBestsellerCatageory: function () {
            return this.$.designCategories.find(function (val) {
                return val.isBestseller();
            });
        },

        entryCount: function() {
            var ret = this.$.entryCount || 0;

            var designCategories = this.$.designCategories;
            if (designCategories) {
                designCategories.each(function(category) {
                    ret += (category.$.entryCount || 0)
                });
            }

            return ret;

        }

    });

    DesignCategory.prototype.schema.designCategories = [DesignCategory];

    return DesignCategory;
});