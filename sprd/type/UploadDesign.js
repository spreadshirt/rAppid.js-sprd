define(["js/core/Bindable"], function(Bindable) {

    var UploadDesign = Bindable.inherit("sprd/type/UploadDesign", {

        defaults: {
            design: null,
            image: null,
            uploadProgress: 0,

            state: null
        }

    });

    UploadDesign.State = {
        ERROR: "error",
        LOADING: "loading",
        LOADED: "loaded"
    };

    return UploadDesign;
});