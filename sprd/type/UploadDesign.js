define(["js/core/Bindable"], function (Bindable) {

    var State = {
        ERROR: "error",
        LOADING: "loading",
        LOADED: "loaded"
    };

    var UploadDesign = Bindable.inherit("sprd.type.UploadDesign", {

        defaults: {
            design: null,
            image: null,
            uploadProgress: 0,

            state: State.LOADED
        }
    });

    UploadDesign.State = State;

    return UploadDesign;
});