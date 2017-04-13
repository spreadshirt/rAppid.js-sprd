define(["underscore", "js/core/List"], function (_, List) {

    return {

        getAsArray: function (listOrArray) {
            if (listOrArray instanceof List) {
                return listOrArray.$items;
            }

            return listOrArray;
        },

        /***
         * {Array} [quantity1]
         * {Array} [quantity2],
         * ...
         * {Array} [quantityN],
         * @return {Array}
         */
        average: function () {
            var ret = [],
                quantities = Array.prototype.slice.call(arguments);

            if (quantities.length === 1) {
                return quantities[0];
            }

            if (quantities.length > 0) {
                var baseQuantity = quantities[0];

                for (var i = 0; i < baseQuantity.length; i++) {
                    var item = baseQuantity[i],
                        found = true;

                    for (var j = 1; j < quantities.length; j++) {
                        if (!_.contains(quantities[j], item)) {
                            found = false;
                            break;
                        }
                    }

                    if (found) {
                        ret.push(item);
                    }
                }
            }


            return ret;
        },
        removeDuplicates: function(array){
            var ret = [];

            for (var i = 0; i < array.length; i++) {
                var element = array[i];
                if(ret.indexOf(element) === -1){
                    ret.push(element);
                }
            }

            return ret;
        },

        move: function(array, item, newIndex) {
            var oldIndex = _.indexOf(array, item);
            if (oldIndex >= 0 && oldIndex != newIndex) {
                array.splice(oldIndex, 1);
                array.splice(newIndex, 0, item);
            }

            return array;
        },

        moveToStart: function(array, items) {
            if (!_.isArray(items)) {
                items = [item];
            }

            var self = this;
            items = this.removeDuplicates(items);

            for (var i = items.length - 1; i >= 0; i--) {
                self.move(array, items[i], 0);
            }

            return array;
        }
    };

});