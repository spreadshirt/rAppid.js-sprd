define(["sprd/data/SprdModel", "sprd/entity/Payment"], function(SprdModel, PaymentMethod, Payment) {


    return SprdModel.inherit("sprd.model.Checkout", {

        defaults: {
            paymentMethod: null,
            payment: null,
            links: null
        },

        $isDependentObject: true,

        schema: {
            paymentMethod: PaymentMethod,
            // TODO: find the circular dependency
            payment: "sprd/entity/Payment",
            links: Object
        },

        save: function() {

            var dataSource = this.$context.$dataSource;
            var url = this._buildUriForResource(this);

            var processor = dataSource.getProcessorForModel(this);
            var formatProcessor = dataSource.getFormatProcessor("save", this);

            var form = document.createElement("form");
            form.setAttribute("method", "post");
            form.setAttribute("action", url);

            var valueField = document.createElement("input");
            valueField.setAttribute("type", "hidden");
            valueField.setAttribute("name", "value");
            valueField.setAttribute("enctype", "application/x-www-form-urlencoded");
            valueField.setAttribute("value", formatProcessor.serialize(processor.compose(this, "save")));

            form.appendChild(valueField);
            document.body.appendChild(form);
            form.submit();

        }

    });

});