define(['sprd/data/SprdModel'], function (SprdModel) {
    return SprdModel.inherit('sprd.model.LabelType', {
        schema: {
            name: String
        }
    });
});