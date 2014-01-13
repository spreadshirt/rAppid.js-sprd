define(["js/ui/View", "sprd/manager/IBasketManager"], function (View, IBasketManager) {

    return View.inherit("sprd.view.MiniBasketClass", {

        defaults: {
            currency: "{basket.currency}",
            basket: "{basketManager.basket}",
            componentClass: "mini-basket",
            loading: false,
            itemCount: "{basket.totalItemsCount()}"
        },

        inject: {
            basketManager: IBasketManager
        },

        ctor: function () {
            this.callBase();
            this.bind('basketManager', 'on:basketUpdating', function () {
                this.set('loading', true);
            }, this);
            this.bind('basketManager', 'on:basketUpdated', function () {
                this.set('loading', false);
            }, this);

        },

        _renderLoading: function (loading) {
            if (loading) {
                this.addClass("loading");
            } else {
                this.removeClass("loading");
            }
        },

        _commitCurrency: function (currency) {
            currency && currency.fetch();
        }
    });
});