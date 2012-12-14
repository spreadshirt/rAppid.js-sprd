define(['sprd/entity/Configuration', 'sprd/entity/Size', 'sprd/util/UnitUtil', 'sprd/model/Design'], function (Configuration, Size, UnitUtil, Design) {
    return Configuration.inherit('sprd.model.DesignConfiguration', {

        schema: {
            type: String,
            content: Object,
            designs: Object,
            restrictions: Object
        },

        defaults: {
            type: 'design',
            _dpi: "{printType.dpi}"
        },

        ctor: function () {
            this.$sizeCache = {};

            this.callBase();
        },

        size: function () {

            if (this.$.design && this.$.printType && this.$.printType.$.dpi) {
                var dpi = this.$.printType.$.dpi;
                if (!this.$sizeCache[dpi]) {
                    this.$sizeCache[dpi] = UnitUtil.convertSizeToMm(this.$.design.$.size, dpi);
                }

                return  this.$sizeCache[dpi];
            }

            return Size.empty;
        }.onChange("_dpi", "design"),

        compose: function () {
            var ret = this.callBase();

            var transform = [],
                scale = this.$.scale;
            if (scale) {
                transform.push("scale(" + scale.x + "," + scale.y + ")");
            }
            var printColorIds = [13];
//            TODO: add rotation
//            if(this.$.rotate){
//                transform.push("rotate("+this.scale.x +","+this.scale.y+")");
//            }

            var designId = this.$.design.$.wtfMbsId;
            ret.content = {
                unit: "mm",
                dpi: "25.4",
                svg: {
                    image: {
                        transform: transform.join(" "),
                        width: Math.round(this.width(),3),
                        height: Math.round(this.height(),3),
                        designId: designId,
                        printColorIds: printColorIds.join(" ")
                    }
                }
            };

            ret.restrictions = {
                changeable: true
            };

            return ret;
        }
    });
});