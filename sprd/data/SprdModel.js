define(["js/data/Model", "js/core/List"], function (Model, List) {
	return Model.inherit("sprd.data.SprdModel", {

		$mapAttributes : {

		},

		parse : function (data) {

			data = this.callBase();

			for (var type in this.$mapAttributes) {
				if (this.$mapAttributes.hasOwnProperty(type)) {
					var factory = this.$mapAttributes[type];

					if (data[type] && data[type] instanceof List) {

						var self = this;
						data[type].each(function (value, key) {
							if (!(value instanceof factory)) {
								data[type].$items[key] = new factory(value);
							}
						});
					}

				}

			}

			return data;

		}
	});
});
