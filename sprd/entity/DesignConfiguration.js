define(['sprd/entity/Configuration', 'sprd/model/Design'], function(Configuration, Design) {

    return Configuration.inherit('sprd/entity/DesignConfiguration', {
        defaults: {
            design: Design,
            url: null
        },

        render: function(paper) {
            if (!this.$.url) {
                return null;
            }

            return paper.image(this.$.url, 0, 0, this.$.width, this.$.height);
        }
    })
});