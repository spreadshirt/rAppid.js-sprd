define(['sprd/entity/Configuration', 'sprd/entity/Size'], function (Configuration, Size) {
	return Configuration.inherit('sprd.model.DesignConfiguration', {

        size: function() {
            if (this.$.design) {
                return this.$.design.$.size;
            }

            return Size.empty;
        }
	});
});