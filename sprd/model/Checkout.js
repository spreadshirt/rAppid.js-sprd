define(["sprd/data/SprdModel", "sprd/model/PaymentType", "sprd/entity/Payment", "underscore", "rAppid", "flow", "require"], function(SprdModel, PaymentType, Payment, _, rAppid, flow, require) {


    return SprdModel.inherit("sprd.model.Checkout", {

        defaults: {
            paymentType: null,
            payment: null,
            returnUrl: null,
            fingerPrint: null
        },

        $isDependentObject: true,

        schema: {
            paymentType: PaymentType,
            payment: Payment,
            returnUrl: String
        },

        save: function(cb) {

            var self = this,
                payment = this.$.payment;

            flow()
                .seq(function(cb) {
                    if (!payment) {
                        return cb();
                    }
                    payment._beforeCompose(cb);
                })
                .seq(function() {

                    var dataSource = self.$context.$dataSource;
                    var url = dataSource._buildUriForResource(self),
                    parameter = {};

                    _.defaults(parameter, self.$context.getQueryParameters(), dataSource.getQueryParameters("put", self));
                    delete parameter.mediaType;
                    url += "?" + rAppid.createQueryString(parameter);

                    var processor = dataSource.getProcessorForModel(self);
                    var formatProcessor = dataSource.getFormatProcessor("save", self);

                    var form = document.createElement("form");
                    form.setAttribute("method", "post");
                    form.setAttribute("action", url);

                    if (self.inIframe()) {
                        // do a navigation on the top frame, self
                        // could fail if a sandbox is defined without allow-top-navigation.

                        // to be more secure, we could just add self _top target, where we know
                        // that the loading checkout don't allow to run within an iframe
                        // (X-Frame-Options, see https://developer.mozilla.org/en-US/docs/Web/HTTP/X-Frame-Options),
                        // which is the case for e.g. paypal
                        form.setAttribute("target", "_top");
                    }

                    var checkoutData = processor.compose(self, "save");

                    var fingerPrint = self.$.fingerPrint;
                    if (fingerPrint && checkoutData.payment) {
                        checkoutData.payment.fingerPrint = fingerPrint;
                    }

                    var valueField = document.createElement("input");
                    valueField.setAttribute("type", "hidden");
                    valueField.setAttribute("name", "value");
                    valueField.setAttribute("enctype", "multipart/form-data");
                    valueField.setAttribute("value", formatProcessor.serialize(checkoutData));

                    form.appendChild(valueField);
                    document.body.appendChild(form);
                    form.submit();

                })
                .exec(cb);


        },


        inIframe: function() {
            try {
                return window.self !== window.top;
            } catch (e) {
                return true;
            }
        },

        compose: function () {
            var ret = this.callBase();

            ret.payment = ret.payment || {};
            ret.paymentType = ret.paymentType || {};

            return ret;
        }

    });

});