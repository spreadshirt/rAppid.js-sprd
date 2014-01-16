define(['sprd/data/SprdModel', 'sprd/model/Label', 'sprd/model/ObjectType', 'sprd/model/LabelObject'], function (SprdModel, Label, ObjectType, LabelObject) {
    return SprdModel.inherit('sprd.model.ObjectLabel', {
        schema: {
            label: Label,
            type: ObjectType,
            object: LabelObject
        }
    });
});