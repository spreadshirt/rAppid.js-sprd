define(['js/core/Component', 'underscore'], function(Component, _){

    return Component.inherit('sprd.manager.FeatureManager', {

        featureSets: {
            // overwrite in sub class
        },

        loadFeatureSet: function(name) {
            var featureSets = this.factory.prototype.featureSets || {};
            this.set(featureSets[name] || {});
        },

        _initializationComplete: function() {

            this.callBase();

            // read features from url
            if (!this.runsInBrowser()) {
                return;
            }

            this.parseDeeplinksFromUrl(window);

            if (window != window.top) {
                try {
                    this.parseDeeplinksFromUrl(window.top);
                } catch (e) {
                }
            }

        },

        parseDeeplinksFromUrl: function(window) {
            var search = window.location.search.replace(/^\?/, "").split("&");
            for (var i = 0; i < search.length; i++) {
                var keyValue = search[i].split("="),
                key = keyValue.shift(),
                value = keyValue.join("=");

                if (this.$.hasOwnProperty(key)) {

                    if (value === "true") {
                        value = true;
                    } else if (value === "false") {
                        value = false;
                    } else if (_.isNumber(this.$[key])) {
                        value = parseFloat(value);
                    }

                    // we react on this key
                    this.set(key, value);
                }
            }
        },

        getFeatureState: function(feature){
            return this.get(feature);
        }.on('change'),

        setFeatureState: function(feature, state){
            this.set(feature, state);
        }
    });
});