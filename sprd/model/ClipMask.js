define(["sprd/model/VectorMask"], function(VectorMask) {
    return VectorMask.inherit("sketchomat.model.ClipMask", {

            combine: function(ctx, mask, img, width, height, options) {
                var oldCompositionOperation = ctx.globalCompositeOperation;

                ctx.drawImage(mask, this.$.offset.$.x, this.$.offset.$.y, this.width(), this.height());
                ctx.globalCompositeOperation = 'source-in';
                ctx.drawImage(img, 0, 0, width, height);

                ctx.globalCompositeOperation = oldCompositionOperation;
            }

        }
    )
});