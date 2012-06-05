define(['sprd/entity/Configuration'], function (Configuration) {
	return Configuration.inherit('sprd.model.TextConfiguration', {
		defaults : {
            text: "",
            font: null,
            fontSize: 36,
            typeFace: "regular"
        }
	});
});