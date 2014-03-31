define(['sprd/data/SprdModel'], function (SprdModel) {
    return SprdModel.inherit('sprd.model.LabelObject', {
        schema: {
            name: String
        }
    });
});