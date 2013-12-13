define(['sprd/data/SprdModel', 'sprd/model/LabelType'], function (SprdModel, LabelType) {
    return SprdModel.inherit('sprd.model.Label', {
        schema: {
            name: String,
            labelType: LabelType
        }
    });
});