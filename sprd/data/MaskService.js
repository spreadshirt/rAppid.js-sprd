define(["js/core/Component", "flow"],
    function (Component, flow) {

        return Component.inherit('sprd.data.MaskService', {

            default: {
                context: null
            },

            applyMask: function (mask, design, shopId, callback) {
                var self = this,
                    context = self.$.context,
                    maskedDesign;
                
                flow()
                    .seq("maskApplier", function () {
                        return mask.getApplier()
                    })
                    .seq("test", function(cb){
                        var applier = this.vars.maskApplier;
                        applier.set({
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
                        callback && callback(err, maskedDesign);
                    })

            }
        });
    });
