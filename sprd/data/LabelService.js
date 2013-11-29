define(["js/core/Component", "sprd/model/Label", "js/data/Collection", "js/data/Query", "js/core/List", "sprd/model/ObjectLabel", "sprd/model/ObjectType"],
    function (Component, Label, Collection, Query, List, ObjectLabel, ObjectType) {

        var ObjectTypeMap = {
            "Order": 7,
            "Basket": 6,
            "DiscountScale": 505,
            "Label": 504,
            "Locale": 503,
            "Language": 502,
            "Currency": 501,
            "Design": 4,
            "Article": 3,
            "Shop": 2,
            "ProductType": 13,
            "Product": 11,
            "User": 1
        };

        return Component.inherit('sprd.data.LabelService', {

            defaults: {
                // Spreadshirt DataSource
                dataSource: null
            },

            getObjectTypeIdForElement: function (element) {

                var name = element.prototype.constructor.name.split(".").pop();

                return ObjectTypeMap[name];
            },
            /**
             * Fetches all labels to an object or a list/array of objects
             * Callback returns a collection of labels
             *
             * @param {sprd.model.Model|js.core.List|Array} object
             * @param {Function} callback
             */
            fetchLabelsForObject: function (object, callback) {
                var list;
                if (object instanceof List) {
                    list = object;
                } else if (object instanceof Array) {
                    list = new List(object);
                } else {
                    list = new List([object]);
                }

                if (list.size()) {
                    var element = list.at(0);
                    var objectType = this.getObjectTypeIdForElement(element);
                    if (!objectType) {
                        callback("Couldn't find label object type for " + element.prototype.constructor.name);
                        return;
                    }
                    var query = new Query().in("objectIds", list.toArray(function (object) {
                        return object.identifier();
                    })).in('objectTypeId', objectType);


                    var labels = this.$.dataSource.createCollection(Collection.of(Label)).query(query);

                    labels.fetch({fullData: true}, callback);
                } else {
                    callback && callback();
                }
            },
            /**
             * Labels an object with the given label
             *
             * @param {sprd.model.Model} object
             * @param {sprd.model.Label} label
             * @param {Function} callback
             */
            labelObject: function (object, label, callback) {

                var labelObject = this.$.dataSource.createEntity(ObjectLabel);

                labelObject.set({
                    object: object,
                    objectType: this.$.dataSource.createEntity(ObjectType, this.getObjectTypeIdForElement(object)),
                    label: label
                });

                labelObject.save(callback);

            }


        });
    });