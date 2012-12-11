define(['sprd/entity/Configuration'], function (Configuration) {
	return Configuration.inherit('sprd.entity.TextConfiguration', {
		defaults : {
            text: "",
            font: null,
            fontSize: 48,
            typeFace: "regular"
        }
	});
});