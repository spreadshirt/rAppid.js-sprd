define(['sprd/model/processor/DefaultProcessor'], function(DefaultProcessor) {

    return DefaultProcessor.inherit("sprd.model.processor.TransformerProcessor", {

        parse: function(model, data, action, options) {
            return {content: data};
        }

        // compose: function(model) {
        //     var payload = this.callBase();
        // }

    });
});