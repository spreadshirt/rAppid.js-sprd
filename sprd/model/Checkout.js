define(["sprd/data/SprdModel", "sprd/model/PaymentType", "sprd/entity/Payment", "underscore", "rAppid"], function(SprdModel, PaymentType, Payment, _, rAppid) {


    return SprdModel.inherit("sprd.model.Checkout", {

        defaults: {
            paymentType: null,
            payment: null,

            successLink: null,
            failLink: null
        },

        $isDependentObject: true,

        schema: {
            paymentType: PaymentType,
            payment: Payment,
            successLink: String,
            failLink: String
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

            var valueField = document.createElement("input");
            valueField.setAttribute("type", "hidden");
            valueField.setAttribute("name", "value");
            valueField.setAttribute("enctype", "multipart/form-data");
            valueField.setAttribute("value", formatProcessor.serialize(processor.compose(this, "save")));

            form.appendChild(valueField);
            document.body.appendChild(form);
            form.submit();

        }

    });

});