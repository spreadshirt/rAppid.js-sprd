define(["sprd/data/SprdModel", "js/data/validator/Validator", "JSON", "moment"], function (SprdModel, Validator, JSON, moment) {

    var CouponValidator = Validator.inherit({
        validate: function (entity, options, callback) {
            var self = this;

            if (!entity.$.code) {
                callback(null, []);
                return;
            }

            entity.save(null, function (err) {
                var errors = [];

                if (err) {
                    var code = "generic",
                        values = [];

                    try {
                        var causes = JSON.parse(err.xhr.responses.text).causes;
                        code = causes[0].error.replace(/^0*/, "");
                        var match;

                        var reg = /\[([^[\]\[]+)\]/gi;
                        while ((match = reg.exec(causes[0].message))) {
                            values.push(match[1]);
                        }
                    } catch (e) {
                    }

                    for (var i = 0; i < values.length; i++) {
                        var val = values[i],
                            m = val.match(/([^\|]+)\|(\w+)/);
                        if (m) {
                            var t = m[2];
                            if (t == "M" && entity.$.currency) {
                                values[i] = entity.$.currency.formatValue(m[1]);
                            } else if (t == "D") {
                                // TODO: localize format date
                                values[i] = moment(m[1]).format("YYYY/MM/DD");
                            } else {
                                values[i] = m[1];
                            }
                        }
                    }

                    var error = self._createError(code, "COUPON_ERROR", "code");
                    error.set('values', values);
                    errors.push(error)
                }

                callback(null, errors);

            });
        }
    });

    return SprdModel.inherit("sprd.model.Coupon", {

        defaults: {
            code: null,
            currency: null
        },

        schema: {
            code: {
                required: false,
                type: String
            }
        },

        validators: [
            new CouponValidator()
        ]
    });

});