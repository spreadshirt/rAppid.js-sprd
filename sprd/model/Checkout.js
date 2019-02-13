define(["sprd/data/SprdModel", "sprd/model/PaymentType", "sprd/entity/Payment", "underscore", "rAppid", "flow", "js/data/Entity"], function(SprdModel, PaymentType, Payment, _, rAppid, flow, Entity) {

    var BrowserInformation = Entity.inherit({

        schema: {
            colorDepth: Number,
            screenWidth: Number,
            screenHeight: Number,
            timeZoneOffset: Number,
            javaEnabled: Boolean
        },

        ctor: function() {
            this.callBase({
                colorDepth: screen.colorDepth,
                screenWidth: screen.width,
                screenHeight: screen.height,
                timeZoneOffset: (new Date()).getTimezoneOffset(),
                javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false
            })
        },

    });

    var AdyenData = Entity.inherit('sprd.model.Checkout.CheckoutResult', {
        schema: {
            pendingPaymentId: {
                type: String,
                required: false
            },
            threeDSMethodUrl: {
                type: String,
                required: false
            },
            adyen3dSecure2EndUrl: {
                type: String,
                required: false
            },
            threeDSServerTransId: {
                type: String,
                required: false
            }
        }
    });


    var CheckoutResult = Entity.inherit('sprd.model.Checkout.CheckoutResult', {
        schema: {
            redirectUrl: {
                type: String,
                required: false
            },
            data: {
                type: AdyenData,
                required: false
            }
        }
    });

    var CreditCardCheckout = SprdModel.inherit("sprd.model.Checkout.CreditCard", {

        $isDependentObject: true,

        resultType: CheckoutResult,

        schema: {
            paymentType: PaymentType,
            payment: Payment,
            browserInformation: BrowserInformation,
            returnUrl: String
        },

        defaults: {
            browserInformation: BrowserInformation
        }

    });

    var AuthorizationData = Entity.inherit('sprd.model.Checkout.AuthorizationData', {
        schema: {
            serverTransactionId: String,
            acsTransactionId: String,
            acsUrl: String,
            messageVersion: String
        }
    });


    var Authorize3dsResult = Entity.inherit('sprd.model.Checkout.CheckoutResult', {
        redirectUrl: {
            type: String,
            required: false
        },
        data: {
            type: AuthorizationData,
            required: false
        }
    });

    var Authorize3ds = SprdModel.inherit("sprd.model.Checkout.Authorize3ds", {

        $isDependentObject: true,

        resultType: Authorize3dsResult,

        defaults: {
            pendingPaymentId: null,
            indicator: null
        },

        schema: {
            pendingPaymentId: String,
            indicator: String
        }
    });

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

        save: function(callback) {

            var self = this,
                payment = this.$.payment;

            flow()
                .seq(function(cb) {
                    if (!payment) {
                        return cb();
                    }
                    payment._beforeCompose(cb);
                })
                .seq("result", function(cb) {

                    if (self.get('paymentType.categoryCode') == 'CREDITCARD') {

                        var model = self.$context.$contextModel.createEntity(CreditCardCheckout);
                        model.set(self.$);
                        model.set("id", null);

                        model.save(null, cb);
                    } else {
                        self.doFormPost();
                        cb();
                    }
                })
                .exec(function(err, data) {
                    callback && callback(err, data.result);
                });


        },

        authorize3ds: function(pendingPaymentId, indicator, callback) {
            var model = this.$context.$contextModel.createEntity(Authorize3ds);

            model.set({
                pendingPaymentId: pendingPaymentId,
                indicator: indicator
            });

            model.save(null, callback);
        },

        doFormPost: function() {

            var dataSource = this.$context.$dataSource,
                parameter  = {};

            var url = dataSource._buildUriForResource(this);

            _.defaults(parameter, this.$context.getQueryParameters(), dataSource.getQueryParameters("put", this));
            delete parameter.mediaType;

            url += "?" + rAppid.createQueryString(parameter);

            var processor = dataSource.getProcessorForModel(this);
            var formatProcessor = dataSource.getFormatProcessor("save", this);

            var checkoutData = processor.compose(this, "save");

            var fingerPrint = this.$.fingerPrint;
            if (fingerPrint && checkoutData.payment) {
                checkoutData.payment.fingerPrint = fingerPrint;
            }

            var data = formatProcessor.serialize(checkoutData);
            this.doFormPost(url, data);

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
            valueField.setAttribute("value", data);

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