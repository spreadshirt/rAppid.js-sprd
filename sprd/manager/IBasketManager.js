define(["js/core/Component"], function (Component) {

    return Component.inherit('sprd.manager.IBasketManager', {

        initBasket: function(callback) {

            var self = this;

            if (this.$basketInitialized) {
                callback && callback();
            } else {
                this._initBasket(function(err) {
                    if (!err) {
                        self.$basketInitialized = true;
                    }

                    callback && callback(err);
                });
            }

        },

        _initBasket: function(callback) {
            callback && callback();
        },

        addElementToBasket: function (element, quantity, callback) {
            callback && callback();
        }
    });


});