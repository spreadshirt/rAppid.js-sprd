define(["js/core/Component", "google/analytics/PageTracker", "sprd/tracking/Omniture", "sprd/tracking/Optimizely", "sprd/tracking/Wellness"], function (Component, PageTracker, Omniture, Optimizely, Wellness) {

    return Component.inherit("sprd.manager.TrackingManagerBase", {

        ctor: function () {
            this.$orderId = (new Date()).getTime();
            this.callBase();
        },

        inject: {
            google: PageTracker,
            omniture: Omniture,
            optimizely: Optimizely,
            wellness: Wellness
        },

        trackAddToBasket: function () {

            var omniture = this.$.omniture,
                google = this.$.google,
                optimizely = this.$.optimizely;

            omniture.track(null, null, ["event24"]);
            google.trackEvent("Basket", "AddToBasket");
            optimizely.trackEvent("AddToBasket");
        },

        /***
         * track an event, after the add to basket button in the size dialog
         * has been clicked
         */
        trackAddToBasketSize: function () {

            var omniture = this.$.omniture,
                google = this.$.google,
                optimizely = this.$.optimizely;

            omniture.track(null, null, ["scAdd"]);
            optimizely.trackEvent("AddToBasket-Size");
            google.trackEvent("Basket", "AddToBasket-Size");

        },

        trackSaveProductTiming: function (time) {
            var google = this.$.google;
            google.trackTiming("Basket", "SaveProduct", time);
        },

        trackProductCreationError: function (statusCode) {

            var omniture = this.$.omniture;

            omniture && omniture.track(null, {
                prop42: statusCode,
                eVar42: statusCode
            });

        },

        trackAddToBasketError: function (error) {
            this.$.google.trackEvent("Basket", "AddToBasketError", error);
        },

        trackAddToBasketImplementationTiming: function (time) {
            this.$.google.trackTiming("Basket", "AddToBasketImplementation", Date.now() - time);
        },

        trackAddToBasketTiming: function (time, basketItems) {
            this.$.google.trackTiming("Basket", "AddToBasket", time, "Items: " + basketItems);
        },

        trackGoToCheckout: function () {

            var omniture = this.$.omniture,
                google = this.$.google;

            google.trackEvent("Basket", "GoToCheckout");
            omniture.track(null, {
                eVar33: "Designer - Checkout Button"
            });

        },

        trackBasketCreated: function () {
            var omniture = this.$.omniture;
            omniture.track("scOpen", null, ["scOpen"]);
        },

        trackAddAnotherProduct: function () {

            var omniture = this.$.omniture,
                google = this.$.google;


            google.trackEvent("Basket", "CreateAnotherProduct");
            omniture.track(null, {
                eVar33: "Designer - Create other Product Button"
            });

        },

        trackNavigation: function (module) {
            this.$.google.trackEvent("Navigation", module);
        },

        /***
         * user clicked on checkout in the basket
         */
        trackCheckout: function () {
            this.$.google.trackEvent("Basket", "Checkout");
        },

        trackTransaction: function (basket) {

            var google = this.$.google,
                orderId = basket.$.id + '-' + (++this.$orderId),
                transaction = google.createTransaction(orderId, null, basket.vatIncluded());

            basket.$.basketItems.each(function (basketItem) {
                var element = basketItem.$.element;
                transaction.addItem(element.sku(), element.uniqueId() + " - " + element.get('item.name'), basketItem.vatIncluded(), basketItem.$.quantity);
            }, this);

            google.trackTransaction(transaction);
        },

        trackMementoStoreError: function (message, length) {
            this.$.google.trackEvent("Error", "MementoStore", message, length);
        },

        trackStartApplication: function() {
            var omniture = this.$.omniture;
            omniture && omniture.track("start", null, ["event1"]);
        },

        trackUncaughtError: function (message, filename, lineNumber, applicationParameter) {

            var google = this.$.google;
            google.trackEvent("Error", "UncaughtError", message + " from " + filename + ":" + lineNumber
                + "\n" + applicationParameter);
        },

        trackFirstClick: function () {
            this.$.omniture.track("firstClick", null, ["event16"]);
            this.$.optimizely.trackEvent("engagement");
        },

        trackApplicationError: function (message, stack) {
            var google = this.$.google;
            google.trackEvent("Error", "ApplicationError", message + (stack || ""));
        },

        trackApplicationStartComplete: function () {
            this.$.omniture.track("finish", {}, ["event2"]);
        },

        trackApplicationLoadTime: function (time) {
            var google = this.$.google;
            google.trackTiming("Application", "LoadingTime", time);
        },

        trackStartError: function (error) {
            var google = this.$.google;
            google.trackEvent("Application", "StartError");
        },

        trackApplicationStartTime: function (time) {
            var google = this.$.google;
            google.trackTiming("Application", "StartTime", time);
        },

        trackOpenSharePanel: function() {
            var optimizely = this.$.optimizely;
            optimizely.trackEvent("OpenSharePanel");
        },

        trackShareOnFacebook: function () {
            var google = this.$.google;
            google.trackEvent("Share", "Facebook");
        },

        trackShareOnTwitter: function () {
            var google = this.$.google;
            google.trackEvent("Share", "Twitter");
        },

        trackShareLink: function () {
            var google = this.$.google;
            google.trackEvent("Share", "Link");
        },

        trackShareByMail: function () {
            var google = this.$.google;
            google.trackEvent("Share", "Mail");
        },

        trackShareByMailSuccess: function () {
            var google = this.$.google;
            google.trackEvent("Share", "MailSuccess");
        },

        trackShareByMailError: function () {
            var google = this.$.google;
            google.trackEvent("Share", "MailError");
        },

        trackDesignClick: function(data) {
            this.$.wellness.track("designSelection", data);
        },

        trackProductTypeSelection: function(data) {
            this.$.wellness.track("productTypeSelection", data);
        }
    });

});