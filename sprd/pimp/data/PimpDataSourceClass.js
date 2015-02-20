define(["js/data/RestDataSource", "js/data/DataSource", "underscore"], function (RestDataSource, DataSource, _) {

    var PimpDefaultProcessor = DataSource.Processor.inherit({

        parse: function (model, data, action, options) {

            if (data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key) && _.isString(data[key])) {
                        data[key] = decodeURIComponent(data[key]);
                    }
                }
            }
            return this.callBase(model, data, action, options);
        }

    });

    return RestDataSource.inherit({
        $defaultProcessorFactory: PimpDefaultProcessor
    })

});