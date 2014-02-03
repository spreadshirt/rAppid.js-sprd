define(['js/core/Component'], function(Component){

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

            var search = window.location.search.replace(/^\?/, "").split("&");
            for (var i = 0; i < search.length; i++) {
                var keyValue = search[i].split("="),
                    key = keyValue.shift(),
                    value = keyValue.join("=");

                if (this.$.hasOwnProperty(key)) {
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