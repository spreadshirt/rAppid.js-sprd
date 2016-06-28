define([], function() {

    var config = {
        EU: {
            de: 352272,
            en: 352263,
            fr: 352260
        },
        NA: {
            us: 352269,
            fr: 352275
        }
    };

    return {
        getForumId: function(platform, language) {
            return (config[platform] || {})[language];
        }
    }

});