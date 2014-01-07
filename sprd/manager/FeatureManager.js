define(['js/core/Component'], function(Component){

    return Component.inherit('sprd.manager.FeatureManager', {

        featureSets: {
            // overwrite in sub class
        },

        loadFeatureSet: function(name) {
            var featureSets = this.factory.prototype.featureSets || {};
            this.set(featureSets[name] || {});
        },

        getFeatureState: function(feature){
            return this.get(feature);
        }.on('change'),

        setFeatureState: function(feature, state){
            this.set(feature, state);
        }
    });
});