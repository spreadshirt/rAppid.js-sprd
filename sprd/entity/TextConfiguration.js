define(['sprd/entity/Configuration'], function (Configuration) {
	return Configuration.inherit('sprd.entity.TextConfiguration', {
		defaults : {
            text: "",
            font: null,
            fontSize: 48,
            typeFace: "regular"
        },

        init: function(callback) {
            callback && callback("Textconfigurations aren't supported yet");
        }
	});
});