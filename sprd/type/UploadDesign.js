define(["js/core/Bindable"], function (Bindable) {

    var State = {
        ERROR: "error",
        LOADING: "loading",
        LOADED: "loaded",
        NONE: "none"
    };

    var UploadDesign = Bindable.inherit("sprd.type.UploadDesign", {

        defaults: {
            design: null,
            image: null,
            uploadProgress: 0,

            state: State.NONE
        }
    });

    UploadDesign.State = State;

    return UploadDesign;
});