define(["js/data/Model"], function(Model) {
    var gateway = '/designer-service/v1/masks/';
    var SVG = "image/svg+xml";

    var AfterEffect = Model.inherit("sprd.model.AfterEffect", {

        defaults: {
            initialized: false
        },

        schema: {
            id: String,
            name: String,
            contentLink: String,
            renderLink: String,
            state: String,
            href: String
        },

        ctor: function() {
            this.callBase();
        },

        events: [
            "processingParametersChanged"
        ],

        apply: function(source, ctx, options, callback) {
            callback && callback(new Error("Not implemented."));
        },

        compose: function() {
            throw new Error("Not implemented.");
        },

        id: function() {
            return this.$.id;
        },

        previewUrl: function(width) {
            var renderLink = this.get('renderLink');

            if(width) {
                renderLink = renderLink + "?width=" + width;
            }

            return renderLink;
        },

        relativePreviewUrl: function(width) {
            if (!gateway) {
                return;
            }

            width = width || 500;
            var url;

            if(this.get("contentType") === SVG) {
                url = gateway + this.$.id + "/content";
            } else {
                url = gateway + this.$.id + "/render?width=" + width;
            }

            return url;
        },

        canvasScalingFactor: function(design) {
            return AfterEffect.canvasScalingFactor(design);
        }
    }, {
        maxCanvasSize: {
            width: 400,
            height: 400
        },

        scaleConstants: {
            step: 0.1,
            max: 2
        },

        canvasScalingFactor: function(design) {
            if (!design) {
                return;
            }
            
            var size = design.$.size,
                widthFactor = AfterEffect.maxCanvasSize.width / size.$.width;
            var heightFactor = AfterEffect.maxCanvasSize.height / size.$.height;

            return Math.min(widthFactor, heightFactor, 1);
        }
    });

    return AfterEffect;
});