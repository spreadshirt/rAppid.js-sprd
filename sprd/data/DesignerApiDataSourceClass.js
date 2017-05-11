define(["js/data/RestDataSource", "sprd/model/processor/TransformerProcessor"], function(RestDataSource, TransformerProcessor) {

    var SVG_MIME_TYPE = "image/svg+xml";
    var DesignerApiDataSource = RestDataSource.inherit("sprd.data.DesignerApiDataSource", {

        defaults: {
            language: null
        },

        $processors: {
            TransformationProcessor: TransformerProcessor
        },

        getQueryParameters: function(method, resource) {
            var ret = this.callBase();

            var language = this.$.language;
            if (language && resource.factory.prototype.constructor.name != "sprd.model.Transformer") {
                ret = _.defaults(ret, {
                    language: language
                });
            }

            return ret;


        },

        getHeaderParameters: function(method, model) {
            return this.callBase();
        },

        getFormatProcessor: function(action, model) {
            if (model && model.factory.prototype.constructor.name == "sprd.model.Transformer") {
                return this.svgFormatProcessor;
            }

            return this.callBase();

        },

        getFormatProcessorForContentType: function(contentType) {

            if (contentType.indexOf(SVG_MIME_TYPE) !== -1) {
                return this.svgFormatProcessor;
            }
            return this.callBase();
        },

        getProcessorForModel: function(model, options) {
            if (model && model.factory.prototype.constructor.name == "sprd.model.Transformer.TransformerResult") {
                return this.$processors["TransformationProcessor"];
            }

            return this.callBase();
        }
    });

    DesignerApiDataSource.SvgFormatProcessor = RestDataSource.XmlFormatProcessor.inherit("sprd.data.DesignerApiDataSource.SvgFormatProcessor", {
        serialize: function(data) {
            return data.content;
        },
        deserialize: function(text) {
            return text;
        },
        getContentType: function() {
            return SVG_MIME_TYPE;
        }
    });

    DesignerApiDataSource.prototype.svgFormatProcessor = new DesignerApiDataSource.SvgFormatProcessor();

    return DesignerApiDataSource;
});