define(["sprd/data/SprdModel", "sprd/model/PaymentType", "sprd/entity/Payment", "underscore", "rAppid"], function(SprdModel, PaymentType, Payment, _, rAppid) {


    return SprdModel.inherit("sprd.model.Checkout", {

        defaults: {
            paymentType: null,
            payment: null,

            returnUrl: null
        },

        $isDependentObject: true,

        schema: {
            paymentType: PaymentType,
            payment: Payment,
            returnUrl: String
        },

        save: function() {

            var dataSource = this.$context.$dataSource;
            var url = dataSource._buildUriForResource(this),
                parameter = {
                    mode: "form"
                };

            _.defaults(parameter, this.$context.getQueryParameters(), dataSource.getQueryParameters("put", this));
            url += "?" + rAppid.createQueryString(parameter);

            var processor = dataSource.getProcessorForModel(this);
            var formatProcessor = dataSource.getFormatProcessor("save", this);

            var form = document.createElement("form");
            form.setAttribute("method", "post");
            form.setAttribute("action", url);

            if (this.inIframe()) {
                // do a navigation on the top frame, this
                // could fail if a sandbox is defined without allow-top-navigation.

                // to be more secure, we could just add this _top target, where we know
                // that the loading checkout don't allow to run within an iframe
                // (X-Frame-Options, see https://developer.mozilla.org/en-US/docs/Web/HTTP/X-Frame-Options),
                // which is the case for e.g. paypal
                form.setAttribute("target", "_top");
            }

            var valueField = document.createElement("input");
            valueField.setAttribute("type", "hidden");
            valueField.setAttribute("name", "value");
            valueField.setAttribute("enctype", "multipart/form-data");
            valueField.setAttribute("value", formatProcessor.serialize(processor.compose(this, "save")));

            form.appendChild(valueField);
            document.body.appendChild(form);
            form.submit();

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