define(["js/core/Component", "flow"],
    function (Component, flow) {

        return Component.inherit('sprd.data.MaskService', {

            default: {
                context: null
            },

            applyMask: function (mask, design, shopId, callback) {
                var self = this,
                    context = self.$.context,
                    designImg = design.$.localHtmlImage,
                    maskedDesign;

                if (!designImg) {
                    return callback && callback();
                }
                
                flow()
                    .seq("maskApplier", function () {
                        return mask.getApplier()
                    })
                    .seq("test", function(cb){
                        var applier = this.vars.maskApplier,
                            scalingFactor = mask.canvasScalingFactor(design.$.localHtmlImage);

                        applier.set({
                            maskWidth: applier.get('maskWidth') / scalingFactor,
                            maskHeight: applier.get('maskHeight') / scalingFactor,
                            designId: design.$.wtfMbsId,
                            targetShopId: shopId
                        });
                        applier.save(null, cb)
                    })
                    .seq('design', function (cb) {
                        if (!this.vars.test && this.vars.test.$.designId) {
                            return cb();
                        }

                        maskedDesign = context.getCollection("designs").createItem("u" + this.vars.test.$.designId);
                        maskedDesign.fetch(null, cb);
                    })
                    .exec(function (err, result) {
                        callback && callback(err, {
                            design: maskedDesign,
                            size: result.test.$.size
                        });
                    })

            }
        });
    });
