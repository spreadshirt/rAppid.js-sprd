define(['sprd/entity/Configuration', 'sprd/model/Design'], function(Configuration, Design) {

    return Configuration.inherit('sprd/entity/DesignConfiguration', {
        defaults: {
            design: Design
        }
    })
});