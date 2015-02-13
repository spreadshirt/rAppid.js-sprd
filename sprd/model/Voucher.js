define(["sprd/data/SprdModel", "js/data/validator/Validator", "JSON", "underscore"], function (SprdModel, Validator, JSON, _) {

    var VoucherValidator = Validator.inherit({
        validate: function(entity, options, callback) {
            var self = this;

            if (!entity.$.voucherCode) {
                callback(null, []);
                return;
            }

            entity.save(null, function(err) {
                var errors = [];

                if (err) {
                    var code = 0;

                    try {
                        code = JSON.parse(err.xhr.responses.text).causes[0].error.replace(/^0*/, "");
                    } catch (e) {
                    }

                    if (!(code >= 201 && code <= 213 || code == 216)) {
                        // error code not supported, fallback to generic
                        code = "generic";
                    }

                    errors.push(self._createError(code, "voucher error", "voucherCode"))
                }

                callback(null, errors);

            });
        }
    });

    return SprdModel.inherit("sprd.model.Voucher", {

        defaults: {
            voucherCode: null,
            basketManager: null
        },

        $isDependentObject: true,

        schema: {
            voucherCode: {
                required: false,
                type: String
            }
        },

        idField: "voucherCode",

        validators: [
            new VoucherValidator()
        ],

        _saveAndRefresh: function(options, callback) {
            var basketManager = this.$.basketManager;

            if (basketManager) {
                basketManager._triggerBasketUpdating();
            }

            SprdModel.prototype.save.call(this, options, function (err, result) {

                if (basketManager) {
                    if (err) {
                        basketManager._triggerBasketUpdated();
                    } else {
                        basketManager.reloadBasket();
                    }
                }

                callback && callback(err, result);
            });
        },

        save: function(options, callback) {
            var self = this;

            this.synchronizeFunctionCall(function (cb) {
                this._saveAndRefresh(options || {}, cb);
            }, "save", function (err, model) {

                setTimeout(function() {
                    self.$synchronizeCache["save"] = null;
                }, 1000);

                callback && callback(err, model);
            }, this);
        }
    });

});