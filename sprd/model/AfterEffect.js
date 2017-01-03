define(["js/data/Model"], function(Model) {

    var AfterEffect = Model.inherit("sketchomat.model.AfterEffect", {

        defaults: {
            id: null,
            name: null,
            initialized: false
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

        previewUrl: function() {
            throw new Error("Not implemented.");
        },

        canvasScalingFactor: function(img) {
            return AfterEffect.canvasScalingFactor(img);
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

        canvasScalingFactor: function(img) {
            var widthFactor = AfterEffect.maxCanvasSize.width / img.width;
            var heightFactor = AfterEffect.maxCanvasSize.height / img.height;

            return Math.min(widthFactor, heightFactor, 1);
        }
    });

    return AfterEffect;
});