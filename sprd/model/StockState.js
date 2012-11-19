define(["sprd/data/SprdModel","sprd/entity/Appearance", "js/data/Entity"], function (Model, Appearance, Entity) {
    return Model.inherit('sprd.model.StockState', {
        schema: {
            appearance: Appearance,
            size: Entity
        }
    });

});