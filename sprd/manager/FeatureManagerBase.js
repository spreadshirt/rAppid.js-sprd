define(['js/core/Component'], function(Component){

    var featureSets = {
        cms: {
            internalBasket: false,
            showBasketWhatNextDialog: false // default true
        },
        partner: {
            platformCheckout: false,
            originId: 16
        }
    };

    return Component.inherit('sprd.manager.FeatureManagerBase', {

        defaults: {
            showDesignInfoDialog: true,
            showProductInfoDialog: true,
            internalBasket: true,

            showProductGallery: false,   //default false
            showProductTypeGallery: true, //default true
            showDesignGallery: true,   //default true
            showDesignUpload: true,    //default true
            showAddText: true, //default true

            showSaveAndShare: true,
            showSaveAndShareEmail: true,

            showInitialDepartmentFilter: true,

            showBasketWhatNextDialog: true,

            platformCheckout: true,

            originId: 14
        },

        loadFeatureSet: function(name) {
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