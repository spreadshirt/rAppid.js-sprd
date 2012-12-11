define(['sprd/entity/Configuration', 'sprd/entity/Size', 'sprd/util/UnitUtil'], function (Configuration, Size, UnitUtil) {
	return Configuration.inherit('sprd.model.DesignConfiguration', {

        defaults: {
            _dpi: "{printType.dpi}"
        },

        ctor: function() {
            this.$sizeCache = {};

            this.callBase();
        },

        size: function() {

            if (this.$.design && this.$.printType && this.$.printType.$.dpi) {
                var dpi = this.$.printType.$.dpi;
                if (!this.$sizeCache[dpi]) {
                    this.$sizeCache[dpi] = UnitUtil.convertSizeToMm(this.$.design.$.size, dpi);
                }

                return  this.$sizeCache[dpi];
            }

            return Size.empty;
        }.onChange("_dpi", "design")
	});
});