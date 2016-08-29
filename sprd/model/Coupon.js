define(["sprd/data/SprdModel", "js/data/validator/Validator", "JSON", "sprd/manager/DateFormat"], function (SprdModel, Validator, JSON, DateFormat) {

    var parseDate = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;

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

                                var dateMatch = parseDate.exec(m[1]),
                                    date = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3], dateMatch[4], dateMatch[5], dateMatch[6]);
                                var timeZoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
                                // timeZoneOffset is positive if the current computer's local time is behind UTC (e.g., Pacific Daylight Time),
                                // and negative if the current computer's local time is ahead of UTC (e.g., Germany).
                                // For this reason timeZoneOffset should subtracted from the time of the parse date (UTC)
                                date.setTime(date.getTime() - timeZoneOffset);

                                values[i] = dateFormat(date, entity.$.locale);

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